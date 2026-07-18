import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, staffAdminProcedure, staffAnyProcedure, staffFormOwnerProcedure, staffFormCreatorProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import cookie from "cookie";
import * as jose from "jose";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import { t } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { notifyOwnerNewResponse, notifyCorretorPush, notifyCorretorStatusChange, broadcastPushToAllStaff } from "./pushNotification";
import { sendProtocolEmail } from "./emailService";
import { notifyCorretoresNewSubmission } from "./corretorNotification";
import { customAuthRouter } from "./authRouter";
import * as staffDb from "./staffDb";
import { verifySessionToken } from "./authService";
import { extractFirstName } from "../shared/respondentName";
import { brandFromValue } from "../shared/brands";
import { sendInviteEmail, sendApprovalEmail, sendRejectionEmail, sendFollowUpEmail, sendCadenceEmail, sendRejectionCadenceEmail } from "./emailService";
import { generateInviteToken } from "./authService";
import { getOrCreateOwnerUser } from "./ownerUser";
import { logAudit, AUDIT_ACTIONS } from "./auditLog";
import { dispatchIntegrations } from "./integrationDispatcher";
import * as googleOAuth from "./googleOAuthService";
import { sendVerificationCode, checkVerificationCode } from "./smsVerification";

/**
 * Strip secret-bearing fields (integration webhook config: URLs, headers, tokens)
 * from a form before returning it on a PUBLIC (unauthenticated) endpoint.
 */
function stripFormSecrets<T extends Record<string, any> | null | undefined>(form: T): T {
  if (!form) return form;
  const { webhook: _webhook, ...safe } = form as any;
  return safe as T;
}

/**
 * ownerFallbackProcedure:
 * If the user is authenticated, use their id.
 * If not authenticated, fall back to the cached owner user.
 * This allows the app to work without login — all data belongs to the owner.
 *
 * This procedure NEVER throws auth errors — getOrCreateOwnerUser always returns a user.
 */
const ownerFallbackProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // getOrCreateOwnerUser never throws — it always returns a valid user
  const ownerUser = await getOrCreateOwnerUser();
  return next({ ctx: { ...ctx, user: ownerUser } });
});

export const appRouter = router({
  system: systemRouter,
  // Legacy auth (Manus OAuth) — kept for backward compatibility
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // New custom auth system
  customAuth: customAuthRouter,

  // ─── Staff Management (admin only: master/diretor/gerente) ───
  staff: router({
    list: staffAdminProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
      let users;
      if (session?.role === 'gerente') {
        // Gerentes only see their own corretores
        users = await staffDb.getCorretoresByManager(session.staffUserId);
      } else {
        users = await staffDb.getAllStaffUsers();
      }
      return users.map((u: any) => ({
        id: u.id, email: u.email, name: u.name, phone: u.phone,
        role: u.role, active: u.active, createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn, avatarUrl: u.avatarUrl,
        cpfCnpj: u.cpfCnpj ?? null,
      }));
    }),

    update: staffAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["master", "diretor", "gerente", "corretor"]).optional(),
        active: z.boolean().optional(),
        cpfCnpj: z.string().max(20).optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const staffBefore = await staffDb.getStaffUserById(id);
        await staffDb.updateStaffUser(id, data as any);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        if (input.role && staffBefore && input.role !== staffBefore.role) {
          logAudit({
            action: AUDIT_ACTIONS.STAFF_UPDATE_ROLE,
            staffUserId: cs?.staffUserId,
            staffName: cs?.name ?? ctx.user.name,
            staffRole: cs?.role,
            targetType: 'staff_user',
            targetId: id,
            targetName: staffBefore.name,
            details: { oldRole: staffBefore.role, newRole: input.role },
          });
        }
        if (input.active !== undefined && staffBefore && input.active !== staffBefore.active) {
          logAudit({
            action: input.active ? AUDIT_ACTIONS.STAFF_ACTIVATE : AUDIT_ACTIONS.STAFF_DEACTIVATE,
            staffUserId: cs?.staffUserId,
            staffName: cs?.name ?? ctx.user.name,
            staffRole: cs?.role,
            targetType: 'staff_user',
            targetId: id,
            targetName: staffBefore.name,
            severity: input.active ? 'info' : 'warning',
          });
        }
        return { success: true };
      }),

    delete: staffAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const staffBefore = await staffDb.getStaffUserById(input.id);
        await staffDb.deleteStaffUser(input.id);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        logAudit({
          action: AUDIT_ACTIONS.STAFF_DELETE,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'staff_user',
          targetId: input.id,
          targetName: staffBefore?.name,
          severity: 'warning',
        });
        return { success: true };
      }),

    invite: staffAdminProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["diretor", "gerente", "corretor"]),
        name: z.string().optional(),
        phone: z.string().optional(),
        origin: z.string(), // Frontend origin for building invite URL
      }))
      .mutation(async ({ ctx, input }) => {
        // Gerentes can only invite corretores
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        if (cs?.role === 'gerente' && input.role !== 'corretor') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Gerentes só podem convidar corretores' });
        }

        // Check if email already has an account
        const existing = await staffDb.getStaffUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este email já possui uma conta" });
        }
        const token = generateInviteToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const { id: inviteId } = await staffDb.createInvite({
          email: input.email.toLowerCase(),
          token,
          role: input.role as any,
          invitedBy: ctx.user.id,
          name: input.name ?? null,
          phone: input.phone ?? null,
          expiresAt,
        });
        const inviteUrl = `${input.origin}/aceitar-convite?token=${token}`;
        const inviterDisplayName = cs?.name ?? ctx.user.name ?? "Administrador";
        await sendInviteEmail({
          to: input.email,
          inviterName: inviterDisplayName,
          role: input.role,
          inviteUrl,
          inviteeName: input.name,
        });

        // Auto-duplicate the main form for corretores
        if (input.role === "corretor" && input.name) {
          try {
            const mainForm = await db.getMainPublishedForm(ctx.user.id);
            if (mainForm) {
              // Create a published copy with the corretor's name as title/slug
              // The form will be assigned to the corretor once they accept the invite
              // For now, store the invite ID in a temporary way — we'll assign after acceptance
              const { id: newFormId, slug } = await db.duplicateFormForCorretor(
                mainForm.id,
                ctx.user.id,
                input.name,
                0, // temporary — will be updated when corretor accepts invite
              );
              // Store the new form ID in the invite for later assignment
              await staffDb.updateInvite(inviteId, { formId: newFormId } as any);
            }
          } catch (err) {
            // Don't fail the invite if form duplication fails
            console.error("[Invite] Failed to auto-duplicate form for corretor:", err);
          }
        }

        logAudit({
          action: AUDIT_ACTIONS.STAFF_INVITE,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'staff_user',
          targetName: input.name ?? input.email,
          details: { email: input.email, role: input.role },
        });
        return { success: true, token };
      }),

    invites: staffAdminProcedure.query(async ({ ctx }) => {
      return staffDb.getInvitesByInviter(ctx.user.id);
    }),

    deleteInvite: staffAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await staffDb.getInviteById(input.id);
        if (!invite || invite.invitedBy !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        }
        if (invite.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite já foi utilizado e não pode ser excluído" });
        }
        await staffDb.deleteInvite(input.id);
        return { success: true };
      }),

    updateInvite: staffAdminProcedure
      .input(z.object({
        id: z.number(),
        email: z.string().email().optional(),
        role: z.enum(["diretor", "gerente", "corretor"]).optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invite = await staffDb.getInviteById(input.id);
        if (!invite || invite.invitedBy !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        }
        if (invite.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite já foi utilizado e não pode ser editado" });
        }
        const { id, ...data } = input;
        await staffDb.updateInvite(id, data as any);
        return { success: true };
      }),

    resendInvite: staffAdminProcedure
      .input(z.object({
        id: z.number(),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invite = await staffDb.getInviteById(input.id);
        if (!invite || invite.invitedBy !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        }
        if (invite.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite já foi utilizado" });
        }
        // Generate new token and extend expiry
        const newToken = generateInviteToken();
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await staffDb.updateInvite(input.id, {
          token: newToken,
          expiresAt: newExpiresAt,
        } as any);
        const inviteUrl = `${input.origin}/aceitar-convite?token=${newToken}`;
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        const inviterDisplayName = cs?.name ?? ctx.user.name ?? "Administrador";
        await sendInviteEmail({
          to: invite.email,
          inviterName: inviterDisplayName,
          role: invite.role,
          inviteUrl,
        });
        return { success: true };
      }),
    /** Get all gerentes (for hierarchy management) */
    gerentes: staffAdminProcedure.query(async () => {
      return staffDb.getAllGerentes();
    }),

    /** Get all corretores with their manager assignment */
    corretoresWithManager: staffAdminProcedure.query(async () => {
      return staffDb.getAllCorretoresWithManager();
    }),

    /** Assign a corretor to a manager (master/diretor only) */
    assignManager: staffFormOwnerProcedure
      .input(z.object({
        corretorId: z.number(),
        managerId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the corretor exists and is a corretor
        const corretor = await staffDb.getStaffUserById(input.corretorId);
        if (!corretor || corretor.role !== 'corretor') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Corretor n\u00e3o encontrado' });
        }
        // Verify the manager exists and is a gerente (if not null)
        if (input.managerId !== null) {
          const manager = await staffDb.getStaffUserById(input.managerId);
          if (!manager || manager.role !== 'gerente') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Gerente n\u00e3o encontrado' });
          }
        }
        await staffDb.assignCorretorToManager(input.corretorId, input.managerId);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        logAudit({
          action: 'staff.assign_manager',
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'staff_user',
          targetId: input.corretorId,
          targetName: corretor.name,
          details: { managerId: input.managerId },
          severity: 'info',
        });
        return { success: true };
      }),

    /**
     * Broadcast a push notification to all staff users with active subscriptions.
     * Used for system-wide announcements (e.g., "Please add your CPF/CNPJ").
     */
    broadcastPush: staffFormOwnerProcedure
      .input(z.object({
        title: z.string().min(1).max(100),
        body: z.string().min(1).max(300),
        url: z.string().optional(),
        tag: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await broadcastPushToAllStaff({
          title: input.title,
          body: input.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          url: input.url ?? "/corretor/configuracoes",
          tag: input.tag ?? `broadcast-${Date.now()}`,
          data: { type: "broadcast", timestamp: Date.now() },
        });
        return result;
      }),
  }),

  // ─── Permissions Management ───
  permissions: router({
    list: staffAdminProcedure.query(async () => {
      return staffDb.getAllPermissions();
    }),

    update: staffAdminProcedure
      .input(z.object({
        role: z.string(),
        permission: z.string(),
        granted: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await staffDb.upsertPermission(input.role, input.permission, input.granted);
        return { success: true };
      }),

    bulkUpdate: staffAdminProcedure
      .input(z.object({
        permissions: z.array(z.object({
          role: z.string(),
          permission: z.string(),
          granted: z.boolean(),
        })),
      }))
      .mutation(async ({ input }) => {
        for (const perm of input.permissions) {
          await staffDb.upsertPermission(perm.role, perm.permission, perm.granted);
        }
        return { success: true };
      }),
  }),

  // ─── Response Validations ───
  validations: router({
    byResponse: staffAnyProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return staffDb.getValidationsByResponse(input.responseId);
      }),

    validate: staffAnyProcedure
      .input(z.object({
        responseId: z.number(),
        questionId: z.string(),
        status: z.enum(["approved", "rejected"]),
        justification: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await staffDb.upsertValidation(
          input.responseId,
          input.questionId,
          input.status,
          ctx.user.id,
          input.justification,
        );
        // Check if all questions are validated
        const allValidations = await staffDb.getValidationsByResponse(input.responseId);
        const response = await db.getResponseById(input.responseId);
        if (response) {
          const questions = response.answers ? Object.keys(response.answers as any) : [];
          const allValidated = questions.every(qId =>
            allValidations.some((v: any) => v.questionId === qId && v.status !== "pending")
          );
          const allApproved = allValidated && allValidations.every((v: any) => v.status === "approved");
          const hasRejection = allValidations.some((v: any) => v.status === "rejected");

          let newStatus: string = "in_review";
          if (allApproved) newStatus = "approved";
          else if (hasRejection) newStatus = "rejected";

          await db.updateResponse(input.responseId, {
            validationStatus: newStatus as any,
            reviewedBy: ctx.user.id,
            reviewedAt: allValidated ? new Date() : undefined,
          });

          // Log individual field validation
          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: input.status === "approved" ? "field_approved" : "field_rejected",
            description: input.status === "approved"
              ? `Campo "${input.questionId}" aprovado`
              : `Campo "${input.questionId}" rejeitado: ${input.justification || "Sem justificativa"}`,
            metadata: { questionId: input.questionId, status: input.status, justification: input.justification },
            performedBy: ctx.user.id,
            performedByName: ctx.user.name || undefined,
          }).catch(() => {});

          // NOTE: Emails and notifications are NOT sent here anymore.
          // They are sent via the "finalizeValidation" endpoint after the corretor
          // finishes reviewing all fields and clicks "Finalizar Validação".
        }
        return { success: true };
      }),

    finalizeValidation: staffAnyProcedure
      .input(z.object({
        responseId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });

        const allValidations = await staffDb.getValidationsByResponse(input.responseId);
        const questions = response.answers ? Object.keys(response.answers as any) : [];
        const allValidated = questions.every(qId =>
          allValidations.some((v: any) => v.questionId === qId && v.status !== "pending")
        );

        if (!allValidated) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ainda há campos pendentes de validação" });
        }

        const allApproved = allValidations.every((v: any) => v.status === "approved");
        const hasRejection = allValidations.some((v: any) => v.status === "rejected");

        let newStatus: string = "in_review";
        if (allApproved) newStatus = "approved";
        else if (hasRejection) newStatus = "rejected";

        // Update final status
        await db.updateResponse(input.responseId, {
          validationStatus: newStatus as any,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        });

        // Send consolidated email
        if (allApproved && response.respondentEmail) {
          await sendApprovalEmail({
            to: response.respondentEmail,
            clientName: response.respondentName || "Cliente",
          });
          await db.stopCadencesForResponse(input.responseId, "form_approved");

          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: "overall_approved",
            description: `Cadastro aprovado! Email de aprovação enviado para ${response.respondentEmail}`,
            performedBy: ctx.user.id,
            performedByName: ctx.user.name || undefined,
          }).catch(() => {});
          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: "approval_email_sent",
            description: `Email de aprovação enviado para ${response.respondentEmail}`,
            metadata: { email: response.respondentEmail },
          }).catch(() => {});
        } else if (hasRejection && response.respondentEmail) {
          const rejections = allValidations.filter((v: any) => v.status === "rejected");
          const reasons = rejections.map((v: any) => v.justification || "Documento/dado precisa de revisão").join("; ");
          await sendRejectionEmail({
            to: response.respondentEmail,
            clientName: response.respondentName || "Cliente",
            reason: reasons,
          });
          await db.createEmailCadence({
            responseId: input.responseId,
            formId: response.formId,
            cadenceType: "reprovacao",
            recipientEmail: response.respondentEmail,
            recipientName: response.respondentName || undefined,
            rejectionReason: reasons,
          });

          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: "overall_rejected",
            description: `Cadastro rejeitado. Motivo: ${reasons}`,
            performedBy: ctx.user.id,
            performedByName: ctx.user.name || undefined,
            metadata: { reasons },
          }).catch(() => {});
          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: "rejection_email_sent",
            description: `Email de rejeição enviado para ${response.respondentEmail}`,
            metadata: { email: response.respondentEmail, reasons },
          }).catch(() => {});
          db.logActivity({
            responseId: input.responseId,
            formId: response.formId,
            activityType: "cadence_started",
            description: `Cadência de reprovação iniciada (3x/semana por 2 meses)`,
            metadata: { cadenceType: "reprovacao" },
          }).catch(() => {});
        }

        // ─── Notify assigned corretores about status change ───
        if (newStatus === "approved" || newStatus === "rejected") {
          try {
            const form = await db.getFormById(response.formId);
            const formTitle = form?.title || "Formulário";
            const respondent = response.respondentName || "Cliente";
            const statusLabel = newStatus === "approved" ? "aprovado" : "rejeitado";
            const statusEmoji = newStatus === "approved" ? "✅" : "❌";
            const notifTitle = `${statusEmoji} Cadastro ${statusLabel}: ${respondent}`;
            const notifBody = `O cadastro de ${respondent} no formulário "${formTitle}" foi ${statusLabel}.`;

            const assignments = await db.getFormAssignments(response.formId);
            const staffIds = assignments.map((a: any) => a.staffUserId);
            if (form?.assignedCorretorId && !staffIds.includes(form.assignedCorretorId)) {
              staffIds.push(form.assignedCorretorId);
            }

            if (staffIds.length > 0) {
              const notifType = newStatus === "approved" ? "response_approved" : "response_rejected";
              const prefsMap = await db.getNotificationPreferencesForStaff(staffIds, notifType);

              const inAppStaffIds = staffIds.filter((id: number) => prefsMap.get(id)?.inApp !== false);
              if (inAppStaffIds.length > 0) {
                db.createStaffNotificationsBatch(
                  inAppStaffIds.map((staffUserId: number) => ({
                    staffUserId,
                    type: notifType,
                    title: notifTitle,
                    body: notifBody,
                    link: "/corretor/respostas",
                    metadata: {
                      formId: response.formId,
                      formTitle,
                      respondentName: respondent,
                      responseId: input.responseId,
                      validationStatus: newStatus,
                    },
                  }))
                ).catch((err) => console.warn("[InAppNotif] Status change batch failed:", (err as any)?.message?.substring(0, 100)));
              }

              for (const staffUserId of staffIds) {
                if (prefsMap.get(staffUserId)?.push === false) continue;
                notifyCorretorStatusChange({
                  staffUserId,
                  formTitle,
                  respondentName: respondent,
                  formId: response.formId,
                  status: newStatus as "approved" | "rejected",
                }).catch((err) => {
                  console.warn(`[CorretorPush] Status change push failed for staff ${staffUserId}:`, (err as Error)?.message?.substring(0, 100));
                });
              }
            }
          } catch (err) {
            console.warn("[Notification] Status change notification failed:", (err as any)?.message?.substring(0, 100));
          }
        }

        return { success: true, status: newStatus };
      }),
  }),

  // ─── Forms (admin only: master/diretor/gerente) ───
  forms: router({
    list: staffAdminProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession as any;
      // Master/diretor see all forms; gerentes only see forms assigned to their corretores
      if (session?.role === 'gerente' && session?.staffUserId) {
        // Get corretores managed by this gerente
        const corretores = await staffDb.getCorretoresByManager(session.staffUserId);
        if (corretores.length === 0) return []; // No corretores = no forms to see
        // Get form IDs assigned to any of the gerente's corretores
        const corretorIds = corretores.map((c: any) => c.id);
        const allAssignedFormIds = new Set<number>();
        for (const cId of corretorIds) {
          const formIds = await db.getFormIdsByStaff(cId);
          formIds.forEach((id: number) => allAssignedFormIds.add(id));
        }
        // Also include forms directly assigned to the gerente
        const gerenteFormIds = await db.getFormIdsByStaff(session.staffUserId);
        gerenteFormIds.forEach((id: number) => allAssignedFormIds.add(id));
        if (allAssignedFormIds.size === 0) return []; // No assignments at all
        // Fetch by id (any owner) so other-brand assigned forms aren't hidden.
        return db.getFormsByIds(Array.from(allAssignedFormIds));
      }
      return db.getFormsByUser(ctx.user.id);
    }),

    /** Get assignments for a specific form */
    getAssignments: staffFormCreatorProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getFormAssignments(input.formId);
      }),

    /** Get assignments for a form with staff user details (name, id, role) — for corretor filter */
    getAssignmentsWithStaff: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        const assignments = await db.getFormAssignments(input.formId);
        if (assignments.length === 0) return [];
        const staffIds = assignments.map((a: any) => a.staffUserId);
        const staffList = await Promise.all(
          staffIds.map((id: number) => staffDb.getStaffUserById(id))
        );
        let result = staffList
          .filter((u): u is NonNullable<typeof u> => u !== null && u.active)
          .map((u) => ({ id: u.id, name: u.name, role: u.role }))
          .filter((u) => u.role === 'corretor');
        // Gerentes only see their own corretores
        if (session?.role === 'gerente') {
          const myCorretores = await staffDb.getCorretoresByManager(session.staffUserId);
          const myIds = new Set(myCorretores.map((c: any) => c.id));
          result = result.filter((u) => myIds.has(u.id));
        }
        return result;
      }),

    /** Get assignments for multiple forms (batch) */
    getAssignmentsBatch: staffFormCreatorProcedure
      .input(z.object({ formIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return db.getFormAssignmentsBatch(input.formIds);
      }),

    /** Set assignments for a form (replaces existing) */
    setAssignments: staffFormCreatorProcedure
      .input(z.object({
        formId: z.number(),
        staffUserIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Formulário não encontrado' });
        }
        // Get current assignments for audit diff
        const oldAssignments = await db.getFormAssignments(input.formId);
        const oldIds = oldAssignments.map((a: any) => a.staffUserId);
        
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        await db.setFormAssignments(input.formId, input.staffUserIds, cs?.staffUserId);

        // Audit: log added users
        const addedIds = input.staffUserIds.filter(id => !oldIds.includes(id));
        const removedIds = oldIds.filter((id: number) => !input.staffUserIds.includes(id));

        if (addedIds.length > 0) {
          logAudit({
            action: AUDIT_ACTIONS.FORM_ASSIGN,
            staffUserId: cs?.staffUserId,
            staffName: cs?.name ?? ctx.user.name,
            staffRole: cs?.role,
            targetType: 'form',
            targetId: input.formId,
            targetName: form.title,
            details: { addedStaffIds: addedIds },
          });
        }
        if (removedIds.length > 0) {
          logAudit({
            action: AUDIT_ACTIONS.FORM_UNASSIGN,
            staffUserId: cs?.staffUserId,
            staffName: cs?.name ?? ctx.user.name,
            staffRole: cs?.role,
            targetType: 'form',
            targetId: input.formId,
            targetName: form.title,
            details: { removedStaffIds: removedIds },
          });
        }

        return { success: true };
      }),

    /** List forms assigned to the current staff user (for corretores/gerentes) */
    myAssigned: staffAnyProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession as any;
      if (!session?.staffUserId) return [];
      // Start with forms directly assigned to this staff user
      const assignedFormIds = await db.getFormIdsByStaff(session.staffUserId);
      const allFormIds = new Set<number>(assignedFormIds);
      // Gerentes also see forms assigned to their corretores
      if (session?.role === 'gerente') {
        const myCorretores = await staffDb.getCorretoresByManager(session.staffUserId);
        for (const corretor of myCorretores) {
          const corretorFormIds = await db.getFormIdsByStaff(corretor.id);
          corretorFormIds.forEach((id: number) => allFormIds.add(id));
        }
      }
      if (allFormIds.size === 0) return [];
      // Fetch assigned forms by id directly — they may belong to a different
      // userId than ctx.user (e.g. another brand's forms), so filtering the
      // owner's forms would wrongly hide them.
      return db.getFormsByIds(Array.from(allFormIds));
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string(), brand: z.enum(["one", "vitacon"]).optional() }))
      .query(async ({ input }) => {
        return stripFormSecrets(await db.getFormBySlug(input.slug, input.brand));
      }),

    getBrandDefault: publicProcedure
      .input(z.object({ brand: z.enum(["one", "vitacon"]) }))
      .query(async ({ input }) => {
        return stripFormSecrets(await db.getBrandDefaultForm(input.brand));
      }),

    listTemplates: staffAnyProcedure.query(async () => {
      const list = await db.listTemplateForms();
      return list.map((f: any) => stripFormSecrets(f));
    }),

    checkSlugAvailable: publicProcedure
      .input(z.object({ slug: z.string(), excludeFormId: z.number().optional(), brand: z.enum(["one", "vitacon"]).optional() }))
      .query(async ({ input }) => {
        const existing = await db.getFormBySlug(input.slug, input.brand);
        if (!existing) return { available: true };
        if (input.excludeFormId && existing.id === input.excludeFormId) return { available: true };
        return { available: false };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        // Only authenticated staff get integration secrets (webhook); anonymous form-fill does not
        const isStaff = (ctx as any).customSession?.type === "staff";
        return isStaff ? form : stripFormSecrets(form);
      }),

    create: staffFormCreatorProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        slug: z.string().optional(),
        questions: z.any(),
        design: z.any(),
        webhook: z.any().optional(),
        sharing: z.any().optional(),
        workspaceId: z.string().nullable().optional(),
        status: z.enum(["draft", "published", "closed"]).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slug = input.slug || `form_${nanoid(10)}`;
        // Slug must be unique within the form's brand (same slug allowed across brands)
        if (input.slug) {
          const formBrand = (input.sharing as any)?.brand ?? "one";
          const clash = await db.getFormBySlug(slug, formBrand);
          if (clash) {
            throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso nesta marca." });
          }
        }
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        const result = await db.createForm({
          slug,
          userId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          questions: input.questions ?? [],
          design: input.design ?? {},
          webhook: input.webhook ?? null,
          sharing: input.sharing ?? null,
          workspaceId: input.workspaceId ?? null,
          status: input.status ?? "draft",
          color: input.color ?? "#0D8BD9",
          responseCount: 0,
          createdByStaffId: cs?.staffUserId ?? null,
        });
        logAudit({
          action: AUDIT_ACTIONS.FORM_CREATE,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'form',
          targetName: input.title,
          details: { slug },
        });
        return result;
      }),

    update: staffFormCreatorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        questions: z.any().optional(),
        design: z.any().optional(),
        webhook: z.any().optional(),
        sharing: z.any().optional(),
        settings: z.any().optional(),
        workspaceId: z.string().nullable().optional(),
        status: z.enum(["draft", "published", "closed"]).optional(),
        color: z.string().optional(),
        isTemplate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, slug: directSlug, ...data } = input;
        // Verify ownership
        const form = await db.getFormById(id);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        // Gerentes cannot edit template forms
        const session = ctx.customSession as any;
        if (session?.role === 'gerente' && (form as any).isTemplate) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Gerentes não podem editar formulários template" });
        }
        // Slug uniqueness is scoped to the form's brand (same slug allowed across brands)
        const formBrand = (data as any).sharing?.brand ?? (form as any).sharing?.brand ?? "one";
        // Handle direct slug update
        if (directSlug) {
          const sanitized = directSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (sanitized) {
            const existing = await db.getFormBySlug(sanitized, formBrand);
            if (existing && existing.id !== id) {
              throw new TRPCError({ code: 'CONFLICT', message: 'Este slug já está em uso nesta marca.' });
            }
            (data as any).slug = sanitized;
          }
        }
        // Sync slug from sharing settings to the forms.slug column
        if (data.sharing && typeof data.sharing === 'object' && 'slug' in data.sharing && data.sharing.slug) {
          const newSlug = data.sharing.slug as string;
          const existing = await db.getFormBySlug(newSlug, formBrand);
          if (existing && existing.id !== id) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Este slug já está em uso nesta marca.' });
          }
          (data as any).slug = newSlug;
        }
        // Enforce a single default form per brand: if this form is being set as the
        // brand default, clear the flag on every other form of the same brand.
        if ((data as any).sharing && (data as any).sharing.isBrandDefault === true) {
          const brand = (data as any).sharing.brand ?? (form as any).sharing?.brand ?? "one";
          await db.clearBrandDefault(brand, id);
        }
        await db.updateForm(id, data);

        // Sync changes to child forms (copies assigned to corretores)
        // Only sync syncable fields: questions, design, description, webhook, color, status
        const syncableFields: Record<string, any> = {};
        if (data.questions !== undefined) syncableFields.questions = data.questions;
        if (data.design !== undefined) syncableFields.design = data.design;
        if (data.description !== undefined) syncableFields.description = data.description;
        if (data.webhook !== undefined) syncableFields.webhook = data.webhook;
        if (data.color !== undefined) syncableFields.color = data.color;
        if (data.status !== undefined) syncableFields.status = data.status;
        if (data.settings !== undefined) syncableFields.settings = data.settings;

        let syncedCount = 0;
        if (Object.keys(syncableFields).length > 0) {
          try {
            const syncResult = await db.syncChildForms(id, syncableFields);
            syncedCount = syncResult.synced;
            if (syncedCount > 0) {
              console.log(`[FormSync] Synced ${syncedCount} child forms of parent ${id}`);
              const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
              logAudit({
                action: AUDIT_ACTIONS.FORM_TEMPLATE_SYNC,
                staffUserId: cs?.staffUserId,
                staffName: cs?.name ?? ctx.user.name,
                staffRole: cs?.role,
                targetType: 'form',
                targetId: id,
                targetName: form.title,
                details: { message: `Propagou alterações para ${syncedCount} cópia(s)`, syncedCount },
                severity: 'info',
              });
            }
          } catch (err) {
            console.error("[FormSync] Failed to sync child forms:", err);
            // Don't fail the parent update if sync fails
          }
        }

        return { success: true, syncedCopies: syncedCount };
      }),

    delete: staffFormCreatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
        }
        // Gerentes cannot delete template forms
        const session = ctx.customSession as any;
        if (session?.role === 'gerente' && (form as any).isTemplate) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Gerentes não podem excluir formulários template" });
        }
        await db.deleteForm(input.id);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        logAudit({
          action: AUDIT_ACTIONS.FORM_DELETE,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'form',
          targetId: input.id,
          targetName: form.title,
          severity: 'warning',
        });
        return { success: true };
      }),

    duplicate: staffFormCreatorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        workspaceId: z.string().nullable().optional(),
        linkToParent: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const newSlug = `form_${nanoid(10)}`;
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        const result = await db.duplicateForm(input.id, ctx.user.id, newSlug, input.title, input.workspaceId, input.linkToParent);
        logAudit({
          action: AUDIT_ACTIONS.FORM_DUPLICATE,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'form',
          targetId: input.id,
          targetName: input.title,
          details: { newSlug },
        });
        return result;
      }),

    /** Disconnect a copy from its parent template — makes it independent */
    disconnectFromTemplate: staffFormOwnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
        }
        if (!(form as any).parentFormId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este formulário não é uma cópia de template" });
        }
        await db.updateForm(input.id, { parentFormId: null } as any);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        logAudit({
          action: AUDIT_ACTIONS.FORM_TEMPLATE_SYNC,
          staffUserId: cs?.staffUserId,
          staffName: cs?.name ?? ctx.user.name,
          staffRole: cs?.role,
          targetType: 'form',
          targetId: input.id,
          targetName: form.title,
          details: { message: `Desconectou formulário do template (parentFormId: ${(form as any).parentFormId} → null)` },
          severity: 'warning',
        });
        return { success: true };
      }),

    /** Mark responses as seen — updates lastSeenResponseCount to current responseCount */
    markSeen: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        await db.updateForm(input.formId, { lastSeenResponseCount: form.responseCount });
        return { success: true };
      }),

    /** Get conversion stats for a form (funnel: started → complete → approved) */
    getConversionStats: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        period: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
      }))
      .query(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        return db.getConversionStats(input.formId, input.period);
      }),

    /** Export conversion report as PDF */
    exportConversionPdf: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        period: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
      }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        const stats = await db.getConversionStats(input.formId, input.period);
        const { generateConversionReportPdf } = await import("./conversionReportPdf");
        const pdfBuffer = await generateConversionReportPdf({
          formTitle: form.title,
          period: input.period,
          stats,
          generatedAt: new Date(),
        });
        // Return as base64 for client download
        return {
          base64: pdfBuffer.toString("base64"),
          filename: `relatorio-conversao-${form.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${input.period}.pdf`,
        };
      }),
  }),

  // ─── Form Responses ───
  responses: router({
    submit: publicProcedure
      .input(z.object({
        formId: z.number(),
        answers: z.any(),
        respondentName: z.string().optional(),
        respondentEmail: z.string().optional(),
        isComplete: z.boolean().optional(),
        timeSpentSeconds: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createResponse({
          formId: input.formId,
          answers: input.answers,
          respondentName: input.respondentName ?? null,
          respondentEmail: input.respondentEmail ?? null,
          isComplete: input.isComplete ?? true,
          timeSpentSeconds: input.timeSpentSeconds ?? null,
          ipAddress: (ctx.req.headers["x-forwarded-for"] as string) ?? ctx.req.ip ?? null,
          userAgent: ctx.req.headers["user-agent"] ?? null,
          lastActivityAt: new Date(),
        });

        // Always notify assigned staff (even for incomplete/partial responses)
        try {
          const form = await db.getFormById(input.formId);
          const formTitle = form?.title ?? "Formulário";
          const isComplete = input.isComplete !== false;
          // Extract first name: PF → first name of nome, PJ → first name of sócio
          const firstName = extractFirstName(input.answers as Record<string, unknown>, input.respondentName);
          const respondent = firstName !== "Anônimo" ? firstName : (input.respondentName || input.respondentEmail || "Anônimo");
          const statusLabel = isComplete ? "completa" : "parcial (em andamento)";
          const hasName = respondent !== "Anônimo";
          // Only notify once we know WHO is registering (or on completion). Avoids a
          // nameless "Um novo cliente está se cadastrando" before the name is typed.
          const shouldNotify = isComplete || hasName;

          // ─── Owner notifications (webapp push only) ───
          if (shouldNotify) notifyOwnerNewResponse(formTitle, respondent, {
            isComplete,
            protocolCode: result.protocolCode ?? undefined,
            formId: input.formId,
            responseId: result.id,
          }).catch((err) => {
            console.warn("[OwnerPush] Push notification failed:", (err as Error)?.message?.substring(0, 100));
          });

          // Send protocol code email to respondent (only for complete responses)
          if (isComplete && input.respondentEmail && result.protocolCode) {
            sendProtocolEmail({
              to: input.respondentEmail,
              respondentName: input.respondentName ?? undefined,
              protocolCode: result.protocolCode,
              formTitle,
            }).catch((err) => {
              console.warn("[Email] Failed to send protocol email:", (err as Error)?.message?.substring(0, 100));
            });
          }

          // Notify corretores via email with full response data + file links.
          // Only once we know who is registering (or on completion) — no nameless alerts.
          if (shouldNotify) {
            const questions: any[] = form?.questions ?? [];
            notifyCorretoresNewSubmission({
              formId: input.formId,
              protocolCode: result.protocolCode ?? `PARCIAL-${result.id}`,
              formTitle,
              respondentName: input.respondentName ?? undefined,
              respondentEmail: input.respondentEmail ?? undefined,
              answers: input.answers,
              questions,
              responseId: result.id,
              isPartial: !isComplete,
            }).catch((err) => {
              console.warn("[CorretorNotification] Failed:", (err as Error)?.message?.substring(0, 100));
            });
          }

          // Push notification to old assigned corretor (legacy field)
          if (shouldNotify && form?.assignedCorretorId) {
            notifyCorretorPush({
              staffUserId: form.assignedCorretorId,
              formTitle,
              respondentName: respondent,
              protocolCode: result.protocolCode ?? undefined,
              formId: input.formId,
            }).catch((err) => {
              console.warn("[CorretorPush] Failed:", (err as Error)?.message?.substring(0, 100));
            });
          }

          // ─── Notify ALL assigned staff via form_assignments (respecting preferences) ───
          const assignments = await db.getFormAssignments(input.formId);
          const staffIds = assignments.map((a: any) => a.staffUserId);

          // ─── Also notify managers (gerentes) of assigned corretores ───
          const managerIds = new Set<number>();
          for (const sid of staffIds) {
            try {
              const staffUser = await staffDb.getStaffUserById(sid);
              if (staffUser?.managerId) {
                // Don't add if already in staffIds (avoid duplicate)
                if (!staffIds.includes(staffUser.managerId)) {
                  managerIds.add(staffUser.managerId);
                }
              }
            } catch (_) { /* ignore lookup errors */ }
          }
          // Also check legacy assignedCorretorId for manager
          if (form?.assignedCorretorId && !staffIds.includes(form.assignedCorretorId)) {
            try {
              const corretorUser = await staffDb.getStaffUserById(form.assignedCorretorId);
              if (corretorUser?.managerId && !staffIds.includes(corretorUser.managerId)) {
                managerIds.add(corretorUser.managerId);
              }
            } catch (_) { /* ignore */ }
          }

          // Combine all staff to notify: assigned staff + their managers
          const allStaffToNotify = [...staffIds, ...Array.from(managerIds)];

          if (shouldNotify && allStaffToNotify.length > 0) {
            // Use distinct notification types for start vs completion
            const notifType = isComplete ? "new_response" : "response_started";
            const notifTitle = isComplete
              ? `✅ ${respondent !== "Anônimo" ? respondent : "Um cliente"} finalizou o cadastro`
              : (respondent !== "Anônimo" ? `🔔 ${respondent} está se cadastrando` : `🔔 Um novo cliente está se cadastrando`);
            const notifBody = `No formulário ${formTitle}`;

            // Check preferences for each staff user (use the correct type)
            const prefsMap = await db.getNotificationPreferencesForStaff(allStaffToNotify, notifType);

            // In-app notifications — only for staff who have in-app enabled
            const inAppStaffIds = allStaffToNotify.filter((id: number) => prefsMap.get(id)?.inApp !== false);
            if (inAppStaffIds.length > 0) {
              db.createStaffNotificationsBatch(
                inAppStaffIds.map((staffUserId: number) => ({
                  staffUserId,
                  type: notifType as any,
                  title: notifTitle,
                  body: notifBody,
                  link: managerIds.has(staffUserId) ? "/gerente/respostas" : "/corretor/respostas",
                  metadata: {
                    formId: input.formId,
                    formTitle,
                    respondentName: respondent !== "Anônimo" ? respondent : (input.respondentName ?? null),
                    protocolCode: result.protocolCode ?? null,
                    isComplete,
                    responseId: result.id,
                    isManagerNotification: managerIds.has(staffUserId),
                  },
                }))
              ).catch((err) => console.warn("[InAppNotif] Batch create failed:", (err as any)?.message?.substring(0, 100)));
            }

            // Push notifications — only for staff who have push enabled
            for (const staffUserId of allStaffToNotify) {
              if (prefsMap.get(staffUserId)?.push === false) continue;
              // Skip if already notified via legacy assignedCorretorId
              if (form?.assignedCorretorId === staffUserId) continue;
              notifyCorretorPush({
                staffUserId,
                formTitle,
                respondentName: respondent,
                protocolCode: result.protocolCode ?? undefined,
                formId: input.formId,
              }).catch((err) => {
                console.warn(`[CorretorPush] Failed for staff ${staffUserId}:`, (err as Error)?.message?.substring(0, 100));
              });
            }
          }
        } catch (err) {
          // Don't fail the submission if notification fails
          console.warn("[Notification] Failed:", (err as any)?.message?.substring(0, 100));
        }

        // Log activity: response created
        db.logActivity({
          responseId: result.id,
          formId: input.formId,
          activityType: "response_created",
          description: input.isComplete !== false
            ? `Cadastro completo enviado por ${input.respondentName || input.respondentEmail || "Anônimo"}`
            : `Cadastro iniciado por ${input.respondentName || input.respondentEmail || "Anônimo"}`,
        }).catch(() => {});

        // Log protocol email sent
        if (input.respondentEmail && result.protocolCode && input.isComplete !== false) {
          db.logActivity({
            responseId: result.id,
            formId: input.formId,
            activityType: "protocol_email_sent",
            description: `Email de protocolo ${result.protocolCode} enviado para ${input.respondentEmail}`,
            metadata: { protocolCode: result.protocolCode, email: input.respondentEmail },
          }).catch(() => {});
        }

        // Dispatch integrations (webhook, Google Sheets, CRM, etc.)
        try {
          const integForm = await db.getFormById(input.formId);
          const integWebhook = integForm?.webhook as any;
          if (integWebhook) {
            const integFormTitle = integForm?.title ?? "Formulário";
            const integIsComplete = input.isComplete !== false;
            const integQuestions: any[] = integForm?.questions ?? [];
            dispatchIntegrations(integWebhook, {
              formId: input.formId,
              formTitle: integFormTitle,
              responseId: result.id,
              protocolCode: result.protocolCode ?? null,
              respondentName: input.respondentName ?? null,
              respondentEmail: input.respondentEmail ?? null,
              answers: input.answers,
              questions: integQuestions,
              isComplete: integIsComplete,
              submittedAt: new Date().toISOString(),
            }).then((integResults) => {
              const failed = integResults.filter((r) => !r.success);
              if (failed.length > 0) {
                console.warn("[Integrations] Some integrations failed:", failed.map((f) => `${f.integration}: ${f.error}`).join(", "));
              }
              // Log integration dispatch
              db.logActivity({
                responseId: result.id,
                formId: input.formId,
                activityType: "response_created",
                description: `Integrações disparadas: ${integResults.map((r) => `${r.integration}(${r.success ? "ok" : "erro"})`).join(", ")}`,
              }).catch(() => {});
            }).catch((err) => {
              console.warn("[Integrations] Dispatch failed:", (err as Error)?.message?.substring(0, 200));
            });
          }
        } catch (err) {
          console.warn("[Integrations] Setup failed:", (err as Error)?.message?.substring(0, 200));
        }

        return result;
      }),

    listByForm: staffAnyProcedure
      .input(z.object({ formId: z.number(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership or assignment
        const form = await db.getFormById(input.formId);
        if (!form) {
          throw new Error("Form not found");
        }

        const session = ctx.customSession?.type === 'staff' ? ctx.customSession : null;

        // Corretores can only see responses for forms assigned to them
        if (session?.role === 'corretor') {
          const assignedFormIds = await db.getFormIdsByStaff(session.staffUserId);
          if (!assignedFormIds.includes(input.formId)) {
            throw new Error("Access denied: form not assigned to you");
          }
        } else if (form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }

        let responses = await db.getResponsesByFormWithSearch(input.formId, input.search);
        // Gerentes only see responses from their corretores
        // Also include incomplete responses without a corretor assigned (reviewedBy = null)
        // so the gerente can see and assign them
        if (session?.role === 'gerente') {
          const myCorretores = await staffDb.getCorretoresByManager(session.staffUserId);
          const corretorIds = new Set(myCorretores.map((c: any) => c.id));
          responses = responses.filter((r: any) =>
            (r.reviewedBy && corretorIds.has(r.reviewedBy)) ||
            (!r.reviewedBy && !r.isComplete)
          );
        }
        // Fallback: extract respondentName from answers JSON when the DB field is null
        return responses.map((r: any) => {
          if (r.respondentName) return r;
          const ans = r.answers as Record<string, unknown> | null;
          if (!ans) return r;
          let name: string | null = null;
          for (const [k, v] of Object.entries(ans)) {
            if ((k.toLowerCase().includes('nome') || k.toLowerCase().includes('name')) && typeof v === 'string' && v.trim()) {
              name = v.trim();
              break;
            }
          }
          return name ? { ...r, respondentName: name } : r;
        });
      }),

    getById: staffAnyProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getResponseById(input.id);
      }),

    // Public endpoint for clients to load their partial response to continue filling
    getForContinue: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const response = await db.getResponseById(input.id);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }
        // Only return answers and current index, not sensitive data
        return {
          id: response.id,
          formId: response.formId,
          answers: response.answers ?? {},
          isComplete: response.isComplete,
        };
      }),

    /**
     * Find a partial (incomplete) response for a form by CPF/CNPJ or email.
     * Used to offer "continue where you left off" when the client fills in their identifier.
     * Returns null if no partial response found (safe to call publicly).
     */
    findPartialByIdentifier: publicProcedure
      .input(z.object({
        formId: z.number(),
        identifier: z.string().min(3).max(100),
      }))
      .query(async ({ input }) => {
        const partial = await db.findPartialResponseByIdentifier(input.formId, input.identifier);
        if (!partial) return null;
        // Only return safe fields — no sensitive data
        return {
          id: partial.id,
          formId: partial.formId,
          answers: partial.answers ?? {},
          respondentName: partial.respondentName ?? null,
          lastActivityAt: partial.lastActivityAt,
        };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        answers: z.any().optional(),
        isComplete: z.boolean().optional(),
        timeSpentSeconds: z.number().optional(),
        respondentName: z.string().optional(),
        respondentEmail: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Reset abandonmentNotifiedAt so future abandonment can be detected again if client leaves again
        const updateResult = await db.updateResponse(id, { ...data, lastActivityAt: new Date(), abandonmentNotifiedAt: null });
        const generatedProtocol = updateResult?.protocolCode ?? null;

        // Notify corretores when a partial response becomes complete
        if (input.isComplete === true) {
          try {
            const response = await db.getResponseById(id);
            if (response) {
              const form = await db.getFormById(response.formId);
              const formTitle = form?.title ?? "Formulário";
              // Extract first name: PF → first name of nome, PJ → first name of sócio
              const completionFirstName = extractFirstName(
                (input.answers ?? response.answers) as Record<string, unknown>,
                response.respondentName
              );
              const respondent = completionFirstName !== "Anônimo"
                ? completionFirstName
                : (response.respondentName || response.respondentEmail || "Anônimo");
              // Use the newly generated protocol code (from updateResponse) or the one already on the record
              const finalProtocol = generatedProtocol || response.protocolCode || null;

              // Stop any active abandono cadences for this response
              await db.stopCadencesForResponse(id, "form_completed");

              // Send protocol email to respondent now that it's complete
              if (finalProtocol && response.respondentEmail) {
                sendProtocolEmail({
                  to: response.respondentEmail,
                  respondentName: response.respondentName ?? undefined,
                  protocolCode: finalProtocol,
                  formTitle,
                }).catch((err) => {
                  console.warn("[Email] Failed to send protocol email on completion:", (err as Error)?.message?.substring(0, 100));
                });
              }

              // ─── Owner notifications (webapp push only) when partial → complete ───
              notifyOwnerNewResponse(formTitle, respondent, {
                isComplete: true,
                protocolCode: finalProtocol ?? undefined,
                formId: response.formId,
                responseId: id,
              }).catch((err) => {
                console.warn("[OwnerPush] Push notification (completion) failed:", (err as Error)?.message?.substring(0, 100));
              });

              // Notify assigned corretores + their managers (in-app + push)
              const assignments = await db.getFormAssignments(response.formId);
              const staffIds = assignments.map((a: any) => a.staffUserId);
              if (form?.assignedCorretorId && !staffIds.includes(form.assignedCorretorId)) {
                staffIds.push(form.assignedCorretorId);
              }

              // Also notify managers (gerentes) of assigned corretores
              const completionManagerIds = new Set<number>();
              for (const sid of staffIds) {
                try {
                  const su = await staffDb.getStaffUserById(sid);
                  if (su?.managerId && !staffIds.includes(su.managerId)) {
                    completionManagerIds.add(su.managerId);
                  }
                } catch (_) { /* ignore */ }
              }
              const allCompletionStaff = [...staffIds, ...Array.from(completionManagerIds)];

              if (allCompletionStaff.length > 0) {
                const notifTitle = `✅ ${respondent !== "Anônimo" ? respondent : "Um cliente"} finalizou o cadastro`;
                const notifBody = `No formulário ${formTitle}`;

                // Check preferences for each staff user
                const prefsMap = await db.getNotificationPreferencesForStaff(allCompletionStaff, "new_response");

                // In-app notifications — only for staff who have in-app enabled
                const inAppStaffIds = allCompletionStaff.filter((sid: number) => prefsMap.get(sid)?.inApp !== false);
                if (inAppStaffIds.length > 0) {
                  db.createStaffNotificationsBatch(
                    inAppStaffIds.map((staffUserId: number) => ({
                      staffUserId,
                      type: "new_response" as const,
                      title: notifTitle,
                      body: notifBody,
                      link: completionManagerIds.has(staffUserId) ? "/gerente/respostas" : "/corretor/respostas",
                      metadata: { formId: response.formId, formTitle, respondentName: respondent, responseId: id, isComplete: true, isManagerNotification: completionManagerIds.has(staffUserId) },
                    }))
                  ).catch((err) => console.warn("[InAppNotif] Completion batch failed:", (err as any)?.message?.substring(0, 100)));
                }

                // Push notifications — only for staff who have push enabled
                for (const staffUserId of allCompletionStaff) {
                  if (prefsMap.get(staffUserId)?.push === false) continue;
                  notifyCorretorPush({ staffUserId, formTitle, respondentName: respondent, formId: response.formId })
                    .catch((err) => console.warn(`[CorretorPush] Completion push failed for staff ${staffUserId}:`, (err as Error)?.message?.substring(0, 100)));
                }
              }

              // Log activity: response completed
              db.logActivity({
                responseId: id,
                formId: response.formId,
                activityType: "response_completed",
                description: `Cadastro completado por ${respondent}`,
              }).catch(() => {});
            }
          } catch (err) {
            console.warn("[Notification] Failed to notify corretores:", (err as any)?.message?.substring(0, 100));
          }
        }

        return { success: true, protocolCode: generatedProtocol };
      }),

    generateFicha: staffAnyProcedure
      .input(z.object({ responseId: z.number(), excludeAttachmentUrls: z.array(z.string()).optional() }))
      .query(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }
        const form = await db.getFormById(response.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const questions: any[] = form.questions ?? [];
        const answers = (response.answers ?? {}) as Record<string, any>;

        // Determine PF or PJ from the "aquisição como" question
        let tipo: "pf" | "pj" = "pf";
        for (const q of questions) {
          if (/aquisi[cç][aã]o.*como|pretende.*fazer/i.test(q.title) && answers[q.id]) {
            const val = String(answers[q.id]).toLowerCase();
            if (/jur[ií]dica|pj|empresa|cnpj/i.test(val)) {
              tipo = "pj";
            }
            break;
          }
        }

        const { generateFullPdf, mergeWithAttachments } = await import("./pdfGenerator");

        // Fetch corretor name from form assignment
        let corretorName = "";
        let corretorCpf = "";
        if (form.assignedCorretorId) {
          const corretor = await staffDb.getStaffUserById(form.assignedCorretorId);
          if (corretor) {
            corretorName = corretor.name || "";
            corretorCpf = corretor.cpfCnpj || "";
          }
        }

        // Generate the cadastro PDF (Protocolo + Ficha). Vitacon forms get a dedicated
        // from-scratch Vitacon-branded PDF; all other brands keep the One template.
        const pdfInput = {
          tipo,
          answers,
          questions,
          respondentName: response.respondentName ?? undefined,
          respondentEmail: response.respondentEmail ?? undefined,
          createdAt: response.createdAt ?? undefined,
          corretorName,
          corretorCpf,
        };
        let pdfBytes: Uint8Array;
        if (brandFromValue((form as any).sharing?.brand) === "vitacon") {
          const { generateVitaconFichaPdf } = await import("./pdfGeneratorVitacon");
          pdfBytes = await generateVitaconFichaPdf({ ...pdfInput, protocolCode: response.protocolCode ?? undefined });
        } else {
          pdfBytes = await generateFullPdf(pdfInput);
        }

        // Collect file attachments from answers
        const attachments: Array<{ url: string; filename: string; mimeType: string }> = [];
        for (const q of questions) {
          if (q.type === "file-upload" && answers[q.id]) {
            let val = answers[q.id];
            // Parse JSON string if needed (FileUploadInput stores as JSON.stringify)
            if (typeof val === "string" && val.trim().startsWith("{")) {
              try { val = JSON.parse(val); } catch { /* not JSON */ }
            }
            if (typeof val === "object" && val !== null && val.url) {
              attachments.push({
                url: val.url,
                filename: val.filename || val.name || q.title,
                mimeType: val.mimeType || val.type || "application/octet-stream",
              });
            } else if (typeof val === "string" && val.startsWith("http")) {
              attachments.push({
                url: val,
                filename: q.title,
                mimeType: "image/jpeg",
              });
            }
          }
        }

        // Also check files table for this response
        const dbFiles = await db.getFilesByResponse(input.responseId);
        for (const f of dbFiles) {
          if (f.url && !attachments.some(a => a.url === f.url)) {
            attachments.push({
              url: f.url,
              filename: f.filename || "arquivo",
              mimeType: f.mimeType || "application/octet-stream",
            });
          }
        }

        // Filter out excluded attachments
        const filteredAttachments = input.excludeAttachmentUrls?.length
          ? attachments.filter(a => !input.excludeAttachmentUrls!.includes(a.url))
          : attachments;

        // Merge with attachments if any
        if (filteredAttachments.length > 0) {
          pdfBytes = await mergeWithAttachments(pdfBytes, filteredAttachments);
        }

        // Append comprovantes (ANAPRO + OK do Cliente) as extra pages at the end
        const comprovantes: Array<{ url: string; filename: string; mimeType: string }> = [];
        if (response.anaproFileUrl) {
          comprovantes.push({
            url: response.anaproFileUrl,
            filename: "Comprovante_ANAPRO",
            mimeType: response.anaproFileUrl.match(/\.pdf$/i) ? "application/pdf" : "image/jpeg",
          });
        }
        if (response.clienteOkFileUrl) {
          comprovantes.push({
            url: response.clienteOkFileUrl,
            filename: "OK_do_Cliente",
            mimeType: response.clienteOkFileUrl.match(/\.pdf$/i) ? "application/pdf" : "image/jpeg",
          });
        }
        if (comprovantes.length > 0) {
          pdfBytes = await mergeWithAttachments(pdfBytes, comprovantes);
        }

        // Convert to base64 for transport
        const base64 = Buffer.from(pdfBytes).toString("base64");
        const respondent = response.respondentName || "cadastro";
        const filename = `Protocolo_Ficha_${tipo.toUpperCase()}_${respondent.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").trim()}.pdf`;

        return { base64, filename, tipo };
      }),

    listAttachments: staffAnyProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }
        const form = await db.getFormById(response.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const questions: any[] = form.questions ?? [];
        const answers = (response.answers ?? {}) as Record<string, any>;
        const attachments: Array<{ url: string; filename: string; mimeType: string; source: string }> = [];

        // Collect from file-upload answers
        for (const q of questions) {
          if (q.type === "file-upload" && answers[q.id]) {
            let val = answers[q.id];
            if (typeof val === "string" && val.trim().startsWith("{")) {
              try { val = JSON.parse(val); } catch { /* not JSON */ }
            }
            if (typeof val === "object" && val !== null && val.url) {
              attachments.push({
                url: val.url,
                filename: val.filename || val.name || q.title,
                mimeType: val.mimeType || val.type || "application/octet-stream",
                source: q.title,
              });
            } else if (typeof val === "string" && val.startsWith("http")) {
              attachments.push({
                url: val,
                filename: q.title,
                mimeType: "image/jpeg",
                source: q.title,
              });
            }
          }
        }

        // Collect from files table
        const dbFiles = await db.getFilesByResponse(input.responseId);
        for (const f of dbFiles) {
          if (f.url && !attachments.some(a => a.url === f.url)) {
            attachments.push({
              url: f.url,
              filename: f.filename || "arquivo",
              mimeType: f.mimeType || "application/octet-stream",
              source: "Arquivo enviado",
            });
          }
        }

        return attachments;
      }),

    shareFicha: staffAnyProcedure
      .input(z.object({ responseId: z.number(), excludeAttachmentUrls: z.array(z.string()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }
        const form = await db.getFormById(response.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const questions: any[] = form.questions ?? [];
        const answers = (response.answers ?? {}) as Record<string, any>;

        let tipo: "pf" | "pj" = "pf";
        for (const q of questions) {
          if (/aquisi[cç][aã]o.*como|pretende.*fazer/i.test(q.title) && answers[q.id]) {
            const val = String(answers[q.id]).toLowerCase();
            if (/jur[ií]dica|pj|empresa|cnpj/i.test(val)) {
              tipo = "pj";
            }
            break;
          }
        }

        const { generateFullPdf, mergeWithAttachments } = await import("./pdfGenerator");

        // Fetch corretor name from form assignment
        let corretorName = "";
        let corretorCpf = "";
        if (form.assignedCorretorId) {
          const corretor = await staffDb.getStaffUserById(form.assignedCorretorId);
          if (corretor) {
            corretorName = corretor.name || "";
            corretorCpf = corretor.cpfCnpj || "";
          }
        }

        const pdfInput = {
          tipo,
          answers,
          questions,
          respondentName: response.respondentName ?? undefined,
          respondentEmail: response.respondentEmail ?? undefined,
          createdAt: response.createdAt ?? undefined,
          corretorName,
          corretorCpf,
        };
        let pdfBytes: Uint8Array;
        if (brandFromValue((form as any).sharing?.brand) === "vitacon") {
          const { generateVitaconFichaPdf } = await import("./pdfGeneratorVitacon");
          pdfBytes = await generateVitaconFichaPdf({ ...pdfInput, protocolCode: response.protocolCode ?? undefined });
        } else {
          pdfBytes = await generateFullPdf(pdfInput);
        }

        const attachments: Array<{ url: string; filename: string; mimeType: string }> = [];
        for (const q of questions) {
          if (q.type === "file-upload" && answers[q.id]) {
            let val = answers[q.id];
            // Parse JSON string if needed (FileUploadInput stores as JSON.stringify)
            if (typeof val === "string" && val.trim().startsWith("{")) {
              try { val = JSON.parse(val); } catch { /* not JSON */ }
            }
            if (typeof val === "object" && val !== null && val.url) {
              attachments.push({
                url: val.url,
                filename: val.filename || val.name || q.title,
                mimeType: val.mimeType || val.type || "application/octet-stream",
              });
            } else if (typeof val === "string" && val.startsWith("http")) {
              attachments.push({ url: val, filename: q.title, mimeType: "image/jpeg" });
            }
          }
        }

        const dbFiles = await db.getFilesByResponse(input.responseId);
        for (const f of dbFiles) {
          if (f.url && !attachments.some(a => a.url === f.url)) {
            attachments.push({
              url: f.url,
              filename: f.filename || "arquivo",
              mimeType: f.mimeType || "application/octet-stream",
            });
          }
        }

        // Filter out excluded attachments
        const filteredAttachments = input.excludeAttachmentUrls?.length
          ? attachments.filter(a => !input.excludeAttachmentUrls!.includes(a.url))
          : attachments;

        if (filteredAttachments.length > 0) {
          pdfBytes = await mergeWithAttachments(pdfBytes, filteredAttachments);
        }

        // Append comprovantes (ANAPRO + OK do Cliente) as extra pages at the end
        const comprovantes: Array<{ url: string; filename: string; mimeType: string }> = [];
        if (response.anaproFileUrl) {
          comprovantes.push({
            url: response.anaproFileUrl,
            filename: "Comprovante_ANAPRO",
            mimeType: response.anaproFileUrl.match(/\.pdf$/i) ? "application/pdf" : "image/jpeg",
          });
        }
        if (response.clienteOkFileUrl) {
          comprovantes.push({
            url: response.clienteOkFileUrl,
            filename: "OK_do_Cliente",
            mimeType: response.clienteOkFileUrl.match(/\.pdf$/i) ? "application/pdf" : "image/jpeg",
          });
        }
        if (comprovantes.length > 0) {
          pdfBytes = await mergeWithAttachments(pdfBytes, comprovantes);
        }

        // Upload to S3 for sharing
        const respondent = response.respondentName || "cadastro";
        const safeName = respondent.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").trim().replace(/\s+/g, "_");
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `fichas/${tipo}_${safeName}_${randomSuffix}.pdf`;
        const { url } = await storagePut(fileKey, Buffer.from(pdfBytes), "application/pdf");

        return { url, filename: `Protocolo_Ficha_${tipo.toUpperCase()}_${respondent}.pdf` };
      }),

    myResponses: publicProcedure
      .query(async ({ ctx }) => {
        // Parse cookie to get client session
        const session = ctx.customSession;
        if (!session || session.type !== "client") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de cliente necessário" });
        }
        return db.getResponsesByCpfCnpj(session.cpfCnpj);
      }),

    exportCsv: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        validationStatus: z.enum(["all", "pending", "in_review", "approved", "rejected", "complete", "partial"]).optional().default("all"),
        dateFilter: z.enum(["all", "today", "week", "month"]).optional().default("all"),
        corretorId: z.number().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        let responses = input.search
          ? await db.getResponsesByFormWithSearch(input.formId, input.search)
          : await db.getResponsesByForm(input.formId);

        // Gerentes only see responses from their corretores
        const csvSession = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
        if (csvSession?.role === 'gerente') {
          const myCorretores = await staffDb.getCorretoresByManager(csvSession.staffUserId);
          const corretorIds = new Set(myCorretores.map((c: any) => c.id));
          responses = responses.filter((r: any) => r.reviewedBy && corretorIds.has(r.reviewedBy));
        }

        // Filter by validation status / completion
        if (input.validationStatus && input.validationStatus !== "all") {
          if (input.validationStatus === "complete") {
            responses = responses.filter((r: any) => r.isComplete);
          } else if (input.validationStatus === "partial") {
            responses = responses.filter((r: any) => !r.isComplete);
          } else {
            responses = responses.filter((r: any) => r.validationStatus === input.validationStatus);
          }
        }

        // Filter by date
        if (input.dateFilter && input.dateFilter !== "all") {
          const now = new Date();
          let cutoff: Date;
          if (input.dateFilter === "today") {
            cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          } else if (input.dateFilter === "week") {
            cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          } else {
            cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }
          responses = responses.filter((r: any) => new Date(r.createdAt) >= cutoff);
        }

        // Filter by corretor
        if (input.corretorId) {
          responses = responses.filter((r: any) => r.reviewedBy === input.corretorId);
        }

        const questions: any[] = form.questions ?? [];

        // Build CSV header: fixed columns + one column per question
        const fixedHeaders = ["ID", "Protocolo", "Nome", "Email", "Telefone", "Status", "Validação", "Completo", "Tempo (s)", "Data"];
        const questionHeaders = questions
          .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
          .map((q: any) => q.title || q.id);

        const questionIds = questions
          .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
          .map((q: any) => q.id);

        // Find phone question
        const phoneQ = questions.find((q: any) =>
          q.type === "phone" || (q.title && /telefone|celular|whatsapp|phone/i.test(q.title))
        );

        // Escape CSV value
        const esc = (val: any): string => {
          if (val === null || val === undefined) return "";
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        // Format answer value for CSV
        const formatAnswer = (answer: any): string => {
          if (answer === null || answer === undefined) return "";
          if (Array.isArray(answer)) return answer.join("; ");
          if (typeof answer === "object") {
            if (answer.url) return answer.url;
            return Object.entries(answer)
              .map(([k, v]) => `${k}: ${v}`)
              .join("; ");
          }
          return String(answer);
        };

        const validationLabels: Record<string, string> = {
          approved: "Aprovado",
          rejected: "Rejeitado",
          in_review: "Em revisão",
          pending: "Pendente",
        };

        const rows: string[] = [];
        rows.push([...fixedHeaders, ...questionHeaders].map(esc).join(","));

        for (const resp of responses) {
          const answers = (resp.answers ?? {}) as Record<string, any>;
          const phone = phoneQ && answers[phoneQ.id] ? String(answers[phoneQ.id]) : "";
          const fixedValues = [
            resp.id,
            resp.protocolCode ?? "",
            resp.respondentName ?? "",
            resp.respondentEmail ?? "",
            phone,
            resp.isComplete ? "Completo" : "Parcial",
            validationLabels[resp.validationStatus || "pending"] || "Pendente",
            resp.isComplete ? "Sim" : "Não",
            resp.timeSpentSeconds ?? "",
            resp.createdAt ? new Date(resp.createdAt).toLocaleString("pt-BR") : "",
          ];
          const answerValues = questionIds.map((qId: string) => formatAnswer(answers[qId]));
          rows.push([...fixedValues, ...answerValues].map(esc).join(","));
        }

        return {
          csv: "\uFEFF" + rows.join("\n"),
          filename: `${form.title.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s-]/g, "").trim()}_respostas.csv`,
          totalResponses: responses.length,
        };
      }),

    // ─── Comprovantes obrigatórios (ANAPRO + OK do Cliente) ───
    uploadComprovante: staffAnyProcedure
      .input(z.object({
        responseId: z.number(),
        tipo: z.enum(["anapro", "clienteOk"]),
        fileBase64: z.string(), // base64 encoded file
        mimeType: z.string().default("image/jpeg"),
        filename: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }

        // Upload to S3
        const ext = input.mimeType === "application/pdf" ? "pdf" : input.mimeType.split("/")[1] || "jpg";
        const suffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `comprovantes/${input.tipo}_${input.responseId}_${suffix}.${ext}`;
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Save URL to the response row
        const updateData = input.tipo === "anapro"
          ? { anaproFileUrl: url }
          : { clienteOkFileUrl: url };
        await db.updateResponse(input.responseId, updateData);

        return { url };
      }),

    removeComprovante: staffAnyProcedure
      .input(z.object({
        responseId: z.number(),
        tipo: z.enum(["anapro", "clienteOk"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        }

        const updateData = input.tipo === "anapro"
          ? { anaproFileUrl: null }
          : { clienteOkFileUrl: null };
        await db.updateResponse(input.responseId, updateData);

        return { success: true };
      }),
  }),

  // ─── Form Versions ───
  versions: router({
    create: staffFormOwnerProcedure
      .input(z.object({
        formId: z.number(),
        label: z.string(),
        snapshot: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVersion({
          formId: input.formId,
          label: input.label,
          snapshot: input.snapshot,
          createdBy: ctx.user.id,
        });
      }),

    listByForm: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getVersionsByForm(input.formId);
      }),

    getById: staffAdminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVersionById(input.id);
      }),

    delete: staffFormOwnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVersion(input.id);
        return { success: true };
      }),

    restore: staffFormOwnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const version = await db.getVersionById(input.id);
        if (!version) throw new Error("Version not found");
        const snapshot = version.snapshot as any;
        await db.updateForm(version.formId, {
          title: snapshot.title,
          description: snapshot.description,
          questions: snapshot.questions,
          design: snapshot.design,
        });

        // Sync restored version to child forms
        try {
          const syncResult = await db.syncChildForms(version.formId, {
            questions: snapshot.questions,
            design: snapshot.design,
            description: snapshot.description,
          });
          if (syncResult.synced > 0) {
            console.log(`[FormSync] Version restore synced ${syncResult.synced} child forms of parent ${version.formId}`);
          }
        } catch (err) {
          console.error("[FormSync] Failed to sync child forms on version restore:", err);
        }

        return { success: true };
      }),
  }),

  // ─── Files ───
  files: router({
    upload: staffAnyProcedure
      .input(z.object({
        formId: z.number().optional(),
        responseId: z.number().optional(),
        context: z.string().optional(),
        filename: z.string(),
        contentBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.contentBase64, "base64");
        const fileKey = `uploads/${nanoid(8)}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const record = await db.createFileRecord({
          formId: input.formId ?? null,
          responseId: input.responseId ?? null,
          context: input.context ?? null,
          url,
          fileKey,
          filename: input.filename,
          mimeType: input.mimeType,
          sizeBytes: buffer.length,
          uploadedBy: ctx.user.id,
        });
        return { id: record.id, url, fileKey };
      }),

    /** Public upload — used by form respondents (no auth required) */
    publicUpload: publicProcedure
      .input(z.object({
        filename: z.string(),
        contentBase64: z.string(),
        mimeType: z.string(),
        formId: z.number().optional(),
        context: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate file size (10MB max from base64)
        const buffer = Buffer.from(input.contentBase64, "base64");
        if (buffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo muito grande. Máximo: 10MB" });
        }
        // Validate mime type (only common document/image types). Browsers on mobile,
        // WhatsApp-forwarded files and downloads frequently report an empty or generic
        // ("application/octet-stream") type — so when the reported type isn't allowed,
        // fall back to inferring it from the filename extension before rejecting.
        const EXT_MIME: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
          webp: "image/webp", heic: "image/heic", heif: "image/heif",
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
        const allowedMimes = new Set(Object.values(EXT_MIME));
        let mime = (input.mimeType || "").toLowerCase().trim();
        if (!allowedMimes.has(mime)) {
          const ext = (input.filename.split(".").pop() || "").toLowerCase();
          if (EXT_MIME[ext]) mime = EXT_MIME[ext]; // infer from extension
        }
        if (!allowedMimes.has(mime)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Tipo de arquivo não permitido" });
        }
        const fileKey = `form-uploads/${nanoid(8)}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, mime);
        return { url, fileKey, filename: input.filename, mimeType: mime };
      }),

    listByForm: staffAnyProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getFilesByForm(input.formId);
      }),

    listByResponse: staffAnyProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return db.getFilesByResponse(input.responseId);
      }),

    delete: staffAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFileRecord(input.id);
        return { success: true };
      }),
  }),

  // ─── Push Notifications ───
  push: router({
    subscribe: ownerFallbackProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession as any;
        // Staff users: save to staff_push_subscriptions table
        if (session?.type === "staff" && session?.staffUserId) {
          const result = await db.saveStaffPushSubscription({
            staffUserId: session.staffUserId,
            endpoint: input.endpoint,
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: null,
          });
          // Also save to owner push_subscriptions for owner-level notifications
          await db.savePushSubscription({
            userId: ctx.user.id,
            endpoint: input.endpoint,
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: null,
          }).catch(() => {});
          return { success: true, updated: result.updated };
        }
        // Fallback: save to push_subscriptions (owner)
        const result = await db.savePushSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: null,
        });
        return { success: true, updated: result.updated };
      }),

    unsubscribe: ownerFallbackProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession as any;
        // Staff users: remove from staff_push_subscriptions
        if (session?.type === "staff" && session?.staffUserId) {
          await db.deleteStaffPushSubscription(session.staffUserId, input.endpoint);
        }
        // Also remove from owner push_subscriptions
        await db.deletePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    status: ownerFallbackProcedure
      .query(async ({ ctx }) => {
        const session = ctx.customSession as any;
        // Staff users: check staff_push_subscriptions
        if (session?.type === "staff" && session?.staffUserId) {
          const subs = await db.getActiveStaffPushSubscriptions(session.staffUserId);
          return {
            subscriptionCount: subs.filter((s: any) => s.active).length,
            hasActiveSubscription: subs.some((s: any) => s.active),
          };
        }
        // Fallback: check push_subscriptions (owner)
        const subs = await db.getActivePushSubscriptions(ctx.user.id);
        return {
          subscriptionCount: subs.filter((s: any) => s.active).length,
          hasActiveSubscription: subs.some((s: any) => s.active),
        };
      }),

    vapidPublicKey: publicProcedure
      .query(() => {
        return { key: process.env.VAPID_PUBLIC_KEY ?? "" };
      }),
  }),

  // ─── Staff Push Notifications ───
  staffPush: router({
    subscribe: publicProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get staff session from cookie
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        const result = await db.saveStaffPushSubscription({
          staffUserId: session.staffUserId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: null,
        });
        return { success: true, updated: result.updated };
      }),

    unsubscribe: publicProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.deleteStaffPushSubscription(session.staffUserId, input.endpoint);
        return { success: true };
      }),

    status: publicProcedure
      .query(async ({ ctx }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          return { subscriptionCount: 0, hasActiveSubscription: false };
        }
        const subs = await db.getActiveStaffPushSubscriptions(session.staffUserId);
        return {
          subscriptionCount: subs.filter((s: any) => s.active).length,
          hasActiveSubscription: subs.some((s: any) => s.active),
        };
      }),

    vapidPublicKey: publicProcedure
      .query(() => {
        return { key: process.env.VAPID_PUBLIC_KEY ?? "" };
      }),
  }),

  // ─── Response Folders (Corretor organization) ───
  folders: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession;
      if (!session || session.type !== "staff") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
      }
      const [folders, counts] = await Promise.all([
        db.getResponseFoldersByStaff(session.staffUserId),
        db.getFolderCounts(session.staffUserId),
      ]);
      return folders.map((f: any) => ({ ...f, responseCount: counts[f.id] || 0 }));
    }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        color: z.string().max(30).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        const result = await db.createResponseFolder({
          staffUserId: session.staffUserId,
          name: input.name,
          color: input.color || "#6366f1",
        });
        return { id: result.id, success: true };
      }),

    update: publicProcedure
      .input(z.object({
        folderId: z.number(),
        name: z.string().min(1).max(200).optional(),
        color: z.string().max(30).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.color !== undefined) updateData.color = input.color;
        await db.updateResponseFolder(input.folderId, session.staffUserId, updateData);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.deleteResponseFolder(input.folderId, session.staffUserId);
        return { success: true };
      }),

    assign: publicProcedure
      .input(z.object({
        responseId: z.number(),
        folderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.assignResponseToFolder(input.responseId, input.folderId, session.staffUserId);
        return { success: true };
      }),

    unassign: publicProcedure
      .input(z.object({ responseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.removeResponseFromFolder(input.responseId, session.staffUserId);
        return { success: true };
      }),

    batchAssign: publicProcedure
      .input(z.object({
        responseIds: z.array(z.number()),
        folderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession;
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.batchAssignResponsesToFolder(input.responseIds, input.folderId, session.staffUserId);
        return { success: true, count: input.responseIds.length };
      }),

    assignments: publicProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession;
      if (!session || session.type !== "staff") {
        return [];
      }
      return db.getFolderAssignmentsByStaff(session.staffUserId);
    }),
  }),

  // ─── Corretor Performance Metrics ───
  corretorPerformance: router({
    /** Get performance for a specific corretor (accessible by corretor themselves or admin) */
    byStaffId: publicProcedure
      .input(z.object({ staffUserId: z.number() }))
      .query(async ({ input }) => {
        return db.getCorretorPerformance(input.staffUserId);
      }),

    /** Get performance for the currently logged-in staff user */
    me: publicProcedure.query(async ({ ctx }) => {
      const cookies = cookie.parse(ctx.req?.headers?.cookie || "");
      const staffToken = cookies.staff_token;
      if (!staffToken) return null;
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
        const { payload } = await jose.jwtVerify(staffToken, secret);
        return db.getCorretorPerformance(payload.staffId as number);
      } catch {
        return null;
      }
    }),

    /** Get performance for ALL corretores (admin only) */
    all: staffAdminProcedure.query(async () => {
      return db.getAllCorretoresPerformance();
    }),

    /** Get performance grouped by manager (admin only) */
    byManager: staffAdminProcedure.query(async () => {
      return db.getPerformanceByManager();
    }),
  }),

  // ─── Form Sync Management ───
  formSync: router({
    /** Get count of child forms for a parent form (for sync indicator) */
    childCount: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getChildFormsCount(input.formId);
      }),

    /** Get all child forms with corretor info (for management panel) */
    children: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getChildFormsWithCorretores(input.formId);
      }),

    /** Force sync a parent form to all children */
    forceSync: staffFormOwnerProcedure
      .input(z.object({ formId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
        }
        const result = await db.syncChildForms(input.formId, {
          questions: form.questions,
          design: form.design,
          description: form.description,
          webhook: form.webhook as any,
          color: form.color,
          status: form.status,
        });
        return result;
      }),
  }),

  // ─── Corretores ───
  corretores: router({
    list: staffAdminProcedure.query(async ({ ctx }) => {
      return db.getCorretoresByUser(ctx.user.id);
    }),

    listPublic: publicProcedure.query(async () => {
      const legacyCorretores = await db.getPublicCorretoresWithForms();
      const staffCorretores = await db.getStaffCorretoresWithForms();
      const staffIds = new Set(staffCorretores.map((s: any) => s.id));
      const merged = [
        ...staffCorretores,
        ...legacyCorretores.filter((c: any) => !c.staffUserId || !staffIds.has(c.staffUserId)),
      ];
      return merged.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }),

    assignToForm: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        staffUserId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulario nao encontrado" });
        }
        await db.updateForm(input.formId, { assignedCorretorId: input.staffUserId });
        return { success: true };
      }),

    create: staffAdminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCorretor({
          userId: ctx.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          active: true,
        });
      }),

    update: staffAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const corretor = await db.getCorretorById(input.id);
        if (!corretor || corretor.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
        }
        const { id, ...data } = input;
        await db.updateCorretor(id, data);
        return { success: true };
      }),

    delete: staffAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const corretor = await db.getCorretorById(input.id);
        if (!corretor || corretor.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
        }
        await db.deleteCorretor(input.id);
        return { success: true };
      }),

    // Get corretores assigned to a specific form
    byForm: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getCorretoresByForm(input.formId);
      }),

    // Set which corretores are assigned to a form
    setFormCorretores: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        corretorIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
        }
        await db.setFormCorretores(input.formId, input.corretorIds);
        return { success: true };
      }),

    // Toggle notification for a specific corretor on a form
    toggleNotification: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        corretorId: z.number(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleFormCorretorNotification(input.formId, input.corretorId, input.enabled);
        return { success: true };
      }),

    getAssigned: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const form = await db.getFormById(input.formId);
        if (!form) return null;
        if (!form.assignedCorretorId) return null;
        return staffDb.getStaffUserById(form.assignedCorretorId);
      }),
  }),

  // ─── Workspaces (Folders) ───
  workspaces: router({
    list: staffAdminProcedure.query(async ({ ctx }) => {
      return db.getWorkspacesByUser(ctx.user.id);
    }),

    create: staffFormOwnerProcedure
      .input(z.object({
        name: z.string(),
        designDefaults: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createWorkspace({
          name: input.name,
          userId: ctx.user.id,
          designDefaults: input.designDefaults ?? {},
        });
      }),

    update: staffFormOwnerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        designDefaults: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const workspace = await db.getWorkspaceById(input.id);
        if (!workspace || workspace.userId !== ctx.user.id) {
          throw new Error("Workspace not found or access denied");
        }
        const { id, ...data } = input;
        await db.updateWorkspace(id, data);
        return { success: true };
      }),

    delete: staffFormOwnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const workspace = await db.getWorkspaceById(input.id);
        if (!workspace || workspace.userId !== ctx.user.id) {
          throw new Error("Workspace not found or access denied");
        }
        await db.deleteWorkspace(input.id);
        return { success: true };
      }),
  }),

  // ─── Site Settings (OG tags, branding) ───
  siteSettings: router({
    get: publicProcedure.query(async () => {
      const settings = await db.getSiteSettings();
      if (!settings) {
        // Return defaults
        return {
          ogTitle: "Cadastro Digital | One Innovation",
          ogDescription: "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.",
          ogImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/app-icon-3d-512_2f82cd93.png",
          ogUrl: "https://one.cadastrodigital.com.br",
        };
      }
      return {
        ogTitle: settings.ogTitle ?? "Cadastro Digital | One Innovation",
        ogDescription: settings.ogDescription ?? "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.",
        ogImage: settings.ogImage ?? "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/app-icon-3d-512_2f82cd93.png",
        ogUrl: settings.ogUrl ?? "https://one.cadastrodigital.com.br",
      };
    }),

    update: staffAdminProcedure
      .input(z.object({
        ogTitle: z.string().max(500).optional(),
        ogDescription: z.string().max(2000).optional(),
        ogImage: z.string().max(2000).optional(),
        ogUrl: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertSiteSettings(input);
        return { success: true };
      }),

    uploadImage: staffAdminProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `og-images/${nanoid(12)}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Email Cadence System ───
  cadence: router({
    /**
     * Enroll incomplete responses into the abandono cadence.
     * Called by cron: finds responses >24h old without active cadence and creates one.
     */
    enrollIncomplete: staffAdminProcedure
      .input(z.object({
        minAgeHours: z.number().min(1).default(24),
      }))
      .mutation(async ({ input }) => {
        const incompleteResponses = await db.getIncompleteResponsesForFollowUp(input.minAgeHours);
        let enrolled = 0;
        
        for (const response of incompleteResponses) {
          if (!response.respondentEmail) continue;
          try {
            await db.createEmailCadence({
              responseId: response.id,
              formId: response.formId,
              cadenceType: "abandono",
              recipientEmail: response.respondentEmail,
              recipientName: response.respondentName || undefined,
            });
            enrolled++;
          } catch (err) {
            console.warn(`[Cadence] Failed to enroll response ${response.id}:`, (err as Error)?.message?.substring(0, 80));
          }
        }
        
        return { enrolled, total: incompleteResponses.length };
      }),

    /**
     * Process due cadence emails.
     * Called by cron at 9am BRT on Mon/Wed/Fri.
     * Sends emails for all cadences where nextSendAt <= now.
     */
    processDue: staffAdminProcedure
      .input(z.object({
        siteUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const dueCadences = await db.getDueCadences();
        
        if (dueCadences.length === 0) {
          return { sent: 0, failed: 0, total: 0 };
        }

        let sent = 0;
        let failed = 0;

        for (const cadence of dueCadences) {
          const formUrl = cadence.formSlug
            ? `${input.siteUrl}/${cadence.formSlug}?continue=${cadence.responseId}`
            : `${input.siteUrl}/form/${cadence.formId}?continue=${cadence.responseId}`;

          try {
            let success = false;
            const nextSeq = cadence.sequenceNumber + 1;

            if (cadence.cadenceType === "abandono") {
              success = await sendCadenceEmail({
                to: cadence.recipientEmail,
                clientName: cadence.recipientName ?? undefined,
                formTitle: cadence.formTitle,
                formUrl,
                sequenceNumber: nextSeq,
                totalInSequence: cadence.maxSequence,
              });
            } else {
              success = await sendRejectionCadenceEmail({
                to: cadence.recipientEmail,
                clientName: cadence.recipientName ?? undefined,
                formTitle: cadence.formTitle,
                formUrl,
                reason: cadence.rejectionReason || "Documento ou dado precisa de correção",
                sequenceNumber: nextSeq,
                totalInSequence: cadence.maxSequence,
              });
            }

            if (success) {
              await db.advanceCadence(cadence.id);
              // Log the email sent event for history tracking
              try {
                await db.logActivity({
                  responseId: cadence.responseId,
                  formId: cadence.formId,
                  activityType: "cadence_email_sent",
                  description: `E-mail de ${cadence.cadenceType === "abandono" ? "abandono" : "reprovação"} enviado (${cadence.sequenceNumber + 1}/${cadence.maxSequence})`,
                  metadata: {
                    cadenceId: cadence.id,
                    cadenceType: cadence.cadenceType,
                    sequenceNumber: cadence.sequenceNumber + 1,
                    maxSequence: cadence.maxSequence,
                    recipientEmail: cadence.recipientEmail,
                  },
                });
              } catch (logErr) {
                console.warn(`[Cadence] Failed to log activity for cadence ${cadence.id}:`, (logErr as Error).message);
              }
              sent++;
            } else {
              failed++;
            }
          } catch (err) {
            console.error(`[Cadence] Failed for cadence ${cadence.id}:`, (err as Error).message);
            failed++;
          }
        }

        console.log(`[Cadence] Processed ${sent}/${dueCadences.length} cadence emails`);
        return { sent, failed, total: dueCadences.length };
      }),

    /** Get active cadences stats */
    getStats: staffAdminProcedure
      .query(async () => {
        return db.getActiveCadencesCount();
      }),

    /** Stop a specific cadence manually */
    stop: staffAdminProcedure
      .input(z.object({ cadenceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.stopCadence(input.cadenceId, "manual");
        return { success: true };
      }),

    /** Stop all cadences for a response */
    stopForResponse: staffAdminProcedure
      .input(z.object({ responseId: z.number() }))
      .mutation(async ({ input }) => {
        const stopped = await db.stopCadencesForResponse(input.responseId, "manual");
        return { stopped };
      }),

    /** Get cadences for a specific response */
    getByResponse: staffAdminProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return db.getCadencesByResponse(input.responseId);
      }),

    /** Start a cadence manually for a response */
    startManual: staffAdminProcedure
      .input(z.object({
        responseId: z.number(),
        cadenceType: z.enum(["abandono", "reprovacao"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await db.getResponseById(input.responseId);
        if (!response) throw new TRPCError({ code: "NOT_FOUND", message: "Resposta não encontrada" });
        if (!response.respondentEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Resposta não possui e-mail do cliente" });

        await db.createEmailCadence({
          responseId: input.responseId,
          formId: response.formId,
          cadenceType: input.cadenceType,
          recipientEmail: response.respondentEmail,
          recipientName: response.respondentName || undefined,
          rejectionReason: input.rejectionReason,
        });

        // Log activity
        await db.logActivity({
          responseId: input.responseId,
          formId: response.formId,
          activityType: "cadence_started",
          description: `Cadência de ${input.cadenceType === "abandono" ? "abandono" : "reprovação"} iniciada manualmente`,
        });

        return { success: true };
      }),

    /** Get response IDs with active cadences for a form (for filter) */
    getActiveResponseIds: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getResponseIdsWithActiveCadence(input.formId);
      }),

    /** Get email history for a response from activity log */
    getEmailHistory: staffAdminProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        const timeline = await db.getActivityTimeline(input.responseId);
        return timeline.filter((event: any) =>
          ["cadence_email_sent", "cadence_started", "cadence_stopped",
           "follow_up_sent", "rejection_email_sent", "approval_email_sent",
           "protocol_email_sent"].includes(event.activityType)
        );
      }),
  }),

  // ─── Follow-up (Legacy, now uses cadence system) ───
  followUp: router({
    /** Enroll + process in one call (backwards compatible) */
    sendFollowUps: staffAdminProcedure
      .input(z.object({
        minAgeHours: z.number().min(1).default(24),
        siteUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        // Step 1: Enroll new incomplete responses
        const incompleteResponses = await db.getIncompleteResponsesForFollowUp(input.minAgeHours);
        let enrolled = 0;
        for (const response of incompleteResponses) {
          if (!response.respondentEmail) continue;
          try {
            await db.createEmailCadence({
              responseId: response.id,
              formId: response.formId,
              cadenceType: "abandono",
              recipientEmail: response.respondentEmail,
              recipientName: response.respondentName || undefined,
            });
            enrolled++;
          } catch (err) {
            console.warn(`[FollowUp] Enroll failed:`, (err as Error)?.message?.substring(0, 80));
          }
        }

        // Step 2: Process due cadences
        const dueCadences = await db.getDueCadences();
        let sent = 0;
        let failed = 0;

        for (const cadence of dueCadences) {
          const formUrl = cadence.formSlug
            ? `${input.siteUrl}/${cadence.formSlug}?continue=${cadence.responseId}`
            : `${input.siteUrl}/form/${cadence.formId}?continue=${cadence.responseId}`;

          try {
            const nextSeq = cadence.sequenceNumber + 1;
            const success = await sendCadenceEmail({
              to: cadence.recipientEmail,
              clientName: cadence.recipientName ?? undefined,
              formTitle: cadence.formTitle,
              formUrl,
              sequenceNumber: nextSeq,
              totalInSequence: cadence.maxSequence,
            });

            if (success) {
              await db.advanceCadence(cadence.id);
              try {
                await db.logActivity({
                  responseId: cadence.responseId,
                  formId: cadence.formId,
                  activityType: "cadence_email_sent",
                  description: `E-mail de abandono enviado (${nextSeq}/${cadence.maxSequence})`,
                  metadata: {
                    cadenceId: cadence.id,
                    cadenceType: "abandono",
                    sequenceNumber: nextSeq,
                    maxSequence: cadence.maxSequence,
                    recipientEmail: cadence.recipientEmail,
                  },
                });
              } catch (logErr) {
                console.warn(`[FollowUp] Failed to log activity:`, (logErr as Error).message);
              }
              sent++;
            } else {
              failed++;
            }
          } catch (err) {
            console.error(`[FollowUp] Failed:`, (err as Error).message);
            failed++;
          }
        }

        return { enrolled, sent, failed, total: dueCadences.length };
      }),

    getPendingCount: staffAdminProcedure
      .input(z.object({ minAgeHours: z.number().min(1).default(24) }).optional())
      .query(async ({ input }) => {
        const responses = await db.getIncompleteResponsesForFollowUp(input?.minAgeHours ?? 24);
        return { count: responses.length };
      }),
  }),

  // ─── Activity Timeline ───
  activity: router({
    /** Get timeline for a specific response */
    getTimeline: staffAdminProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return db.getActivityTimeline(input.responseId);
      }),
  }),

  // ─── Cadence Management (Global) ───
  cadenceManagement: router({
    /** List all cadences with filters and pagination */
    list: staffAdminProcedure
      .input(z.object({
        status: z.enum(["active", "paused", "stopped"]).optional(),
        cadenceType: z.enum(["abandono", "reprovacao"]).optional(),
        formId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllCadences(input ?? {});
      }),

    /** Get forms that have cadences (for filter dropdown) */
    getFormsWithCadences: staffAdminProcedure
      .query(async () => {
        return db.getFormsWithCadences();
      }),

    /** Pause a single cadence */
    pause: staffAdminProcedure
      .input(z.object({ cadenceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.pauseCadence(input.cadenceId);
        return { success: true };
      }),

    /** Resume a paused cadence */
    resume: staffAdminProcedure
      .input(z.object({ cadenceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.resumeCadence(input.cadenceId);
        return { success: true };
      }),

    /** Stop a single cadence */
    stop: staffAdminProcedure
      .input(z.object({ cadenceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.stopCadence(input.cadenceId, "manual");
        return { success: true };
      }),

    /** Batch pause cadences */
    batchPause: staffAdminProcedure
      .input(z.object({ cadenceIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const count = await db.batchPauseCadences(input.cadenceIds);
        return { success: true, count };
      }),

    /** Batch stop cadences */
    batchStop: staffAdminProcedure
      .input(z.object({ cadenceIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const count = await db.batchStopCadences(input.cadenceIds);
        return { success: true, count };
      }),
  }),

  /** ─── Notifications (real-time badge polling) ─── */
  notifications: router({
    /** Lightweight unread count for admin/gerente sidebar badge */
    unreadCount: staffAdminProcedure.query(async ({ ctx }) => {
      return db.getUnreadResponseCounts(ctx.user.id);
    }),

    /** Unread count for corretor sidebar badge */
    corretorUnreadCount: staffAnyProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession as any;
      if (!session?.staffUserId) {
        return { totalUnread: 0, forms: [] };
      }
      return db.getCorretorUnreadCount(session.staffUserId);
    }),
  }),

  /** ─── Staff In-App Notifications ─── */
  staffNotifications: router({
    /** List notifications for the current staff user */
    list: staffAnyProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const session = ctx.customSession as any;
        if (!session?.staffUserId) return [];
        return db.getStaffNotifications(
          session.staffUserId,
          input?.limit ?? 50,
          input?.offset ?? 0
        );
      }),

    /** Count unread notifications for the current staff user */
    unreadCount: staffAnyProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession as any;
      if (!session?.staffUserId) return 0;
      return db.countUnreadStaffNotifications(session.staffUserId);
    }),

    /** Mark a single notification as read */
    markRead: staffAnyProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession as any;
        if (!session?.staffUserId) return;
        await db.markStaffNotificationRead(input.id, session.staffUserId);
      }),

    /** Mark all notifications as read */
    markAllRead: staffAnyProcedure.mutation(async ({ ctx }) => {
      const session = ctx.customSession as any;
      if (!session?.staffUserId) return;
      await db.markAllStaffNotificationsRead(session.staffUserId);
    }),
  }),

  /** ─── Staff Notification Preferences ─── */
  notificationPreferences: router({
    /** Get all notification preferences for the current staff user */
    get: staffAnyProcedure.query(async ({ ctx }) => {
      const session = ctx.customSession as any;
      if (!session?.staffUserId) return [];
      return db.getStaffNotificationPreferences(session.staffUserId);
    }),

    /** Update a single notification preference */
    update: staffAnyProcedure
      .input(z.object({
        notificationType: z.string(),
        inAppEnabled: z.boolean(),
        pushEnabled: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = ctx.customSession as any;
        if (!session?.staffUserId) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.upsertStaffNotificationPreference(
          session.staffUserId,
          input.notificationType,
          input.inAppEnabled,
          input.pushEnabled,
        );
        return { success: true };
      }),
  }),

  /** ─── Audit Logs ─── */
  audit: router({
    list: staffAdminProcedure
      .input(z.object({
        category: z.enum(["form", "staff", "response", "access", "settings"]).optional(),
        action: z.string().optional(),
        staffUserId: z.number().optional(),
        search: z.string().optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { queryAuditLogs } = await import("./auditLog");
        return queryAuditLogs(input ?? {});
      }),

    stats: staffAdminProcedure.query(async () => {
      const { queryAuditLogs } = await import("./auditLog");
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [recent, warnings] = await Promise.all([
        queryAuditLogs({ startDate: last24h, limit: 1 }),
        queryAuditLogs({ severity: 'warning', startDate: last7d, limit: 1 }),
      ]);

      return {
        totalLast24h: recent.total,
        warningsLast7d: warnings.total,
      };
    }),
  }),

  // ─── Integration Management ───
  integrations: router({
    /**
     * Test Google Sheets connection with service account credentials.
     */
    testGoogleSheets: staffAdminProcedure
      .input(z.object({
        spreadsheetUrl: z.string().min(1),
        sheetName: z.string().default("Respostas"),
        serviceAccountJson: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { testGoogleSheetsConnection } = await import("./googleSheetsService");
        return testGoogleSheetsConnection({
          spreadsheetUrl: input.spreadsheetUrl,
          sheetName: input.sheetName,
          serviceAccountJson: input.serviceAccountJson,
        });
      }),

    /**
     * Get integration logs for a form.
     */
    getLogs: staffAdminProcedure
      .input(z.object({
        formId: z.number(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const [logs, counts] = await Promise.all([
          db.getIntegrationLogsByForm(input.formId, input.limit, input.offset),
          db.countIntegrationLogsByForm(input.formId),
        ]);
        return { logs, counts };
      }),

    /**
     * Get integration logs for a specific response.
     */
    getLogsByResponse: staffAdminProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return db.getIntegrationLogsByResponse(input.responseId);
      }),

    /**
     * Manually retry a failed integration.
     */
    retryLog: staffAdminProcedure
      .input(z.object({ logId: z.number() }))
      .mutation(async ({ input }) => {
        const { retryIntegration } = await import("./integrationDispatcher");
        return retryIntegration(input.logId);
      }),

    /**
     * Get summary stats for integration logs across all forms.
     */
    getStats: staffAdminProcedure
      .query(async () => {
        const { getPendingRetryLogs } = await import("./db");
        const pendingRetries = await getPendingRetryLogs(5);
        return {
          pendingRetries: pendingRetries.length,
        };
      }),

    /**
     * Get global integration logs across all forms (for Settings > Integrações).
     */
    getGlobalLogs: staffAdminProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
        integrationType: z.string().optional(),
        formId: z.number().optional(),
        since: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return db.getGlobalIntegrationLogs({
          limit: input.limit,
          offset: input.offset,
          status: input.status,
          integrationType: input.integrationType,
          formId: input.formId,
          since: input.since,
        });
      }),

    /**
     * Get global integration stats (last 7 days) for the Settings page.
     */
    getGlobalStats: staffAdminProcedure
      .query(async () => {
        return db.getGlobalIntegrationStats();
      }),

    /**
     * Get the Google OAuth authorization URL.
     * The frontend opens this URL in a popup window.
     */
    getGoogleAuthUrl: staffAdminProcedure
      .input(z.object({ redirectUri: z.string().url() }))
      .query(async ({ ctx, input }) => {
        if (!ENV.googleClientId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." });
        }
        // Resolve the staff user ID: prefer customSession.staffUserId, fallback to user.id (Manus OAuth owner)
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        const state = Buffer.from(JSON.stringify({ staffUserId, ts: Date.now() })).toString("base64");
        const url = googleOAuth.getGoogleAuthUrl(input.redirectUri, state);
        return { url };
      }),

    /**
     * Exchange Google OAuth code for tokens after the popup callback.
     */
    connectGoogle: staffAdminProcedure
      .input(z.object({
        code: z.string(),
        redirectUri: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.googleClientId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Google OAuth não configurado." });
        }
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        const result = await googleOAuth.exchangeCodeForTokens(
          input.code,
          input.redirectUri,
          staffUserId
        );
        return result;
      }),

    /**
     * Get the connected Google account for the current staff user.
     */
    getGoogleAccount: staffAdminProcedure
      .query(async ({ ctx }) => {
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        return googleOAuth.getConnectedAccount(staffUserId);
      }),

    /**
     * Disconnect Google account.
     */
    disconnectGoogle: staffAdminProcedure
      .mutation(async ({ ctx }) => {
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        await googleOAuth.disconnectGoogleAccount(staffUserId);
        return { success: true };
      }),

    /**
     * List spreadsheets from the connected Google Drive account.
     */
    listSpreadsheets: staffAdminProcedure
      .query(async ({ ctx }) => {
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        const spreadsheets = await googleOAuth.listSpreadsheets(staffUserId);
        return { spreadsheets };
      }),

    /**
     * Create a new spreadsheet in Google Drive.
     */
    createSpreadsheet: staffAdminProcedure
      .input(z.object({ title: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const staffUserId = ctx.customSession?.type === "staff"
          ? ctx.customSession.staffUserId
          : ctx.user?.id ?? 0;
        return googleOAuth.createSpreadsheet(staffUserId, input.title);
      }),
   }),

  // ─── SMS Phone Verification (Twilio Verify) ───
  smsVerify: router({
    /**
     * Get SMS usage stats for the current month.
     * Admin-only endpoint for cost monitoring.
     */
    getStats: staffAdminProcedure.query(async () => {
      const [monthly, daily] = await Promise.all([
        db.getSmsCountThisMonth(),
        db.getSmsDailyStats(30),
      ]);
      return { monthly, daily };
    }),

    /**
     * Send a verification code via SMS to the given phone number.
     * Public endpoint — called from the form by respondents.
     */
    sendCode: publicProcedure
      .input(z.object({
        phone: z.string().min(8, "Número de telefone inválido"),
        formId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Verify the form has SMS verification enabled
        const form = await db.getFormById(input.formId);
        if (!form) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
        }

        const settings = form.settings ? (typeof form.settings === "string" ? JSON.parse(form.settings) : form.settings) : {};
        if (!settings.smsVerification) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Verificação por SMS não está habilitada neste formulário" });
        }

        const result = await sendVerificationCode(input.phone);
        if (!result.success) {
          if (result.rateLimited) {
            // Log rate limited attempt
            db.logSms({ phone: input.phone, formId: input.formId, status: "rate_limited" }).catch(() => {});
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: result.error || "Limite de envios atingido",
            });
          }
          // Log failed attempt
          db.logSms({ phone: input.phone, formId: input.formId, status: "failed" }).catch(() => {});
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Falha ao enviar código SMS" });
        }

        // Log successful send
        db.logSms({ phone: input.phone, formId: input.formId, verificationSid: result.sid, status: "sent" }).catch(() => {});

        return {
          success: true,
          message: "Código enviado com sucesso",
          remaining: result.remaining ?? 0,
        };
      }),

    /**
     * Check a verification code submitted by the respondent.
     */
    checkCode: publicProcedure
      .input(z.object({
        phone: z.string().min(8, "Número de telefone inválido"),
        code: z.string().length(6, "Código deve ter 6 dígitos"),
        formId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const result = await checkVerificationCode(input.phone, input.code);
        if (!result.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Falha ao verificar código" });
        }

        if (!result.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido ou expirado" });
        }

        // Log successful verification
        db.logSms({ phone: input.phone, formId: input.formId, status: "verified" }).catch(() => {});

        return { success: true, valid: true, message: "Número verificado com sucesso" };
      }),
  }),
  // ─── Trash (Soft Delete Recovery) ───
  trash: router({
    list: ownerFallbackProcedure.query(async ({ ctx }) => {
      const [trashedForms, trashedResponses] = await Promise.all([
        db.getTrashedForms(ctx.user.id),
        db.getTrashedResponses(ctx.user.id),
      ]);
      return { forms: trashedForms, responses: trashedResponses };
    }),
    restoreForm: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formul\u00e1rio n\u00e3o encontrado" });
        }
        await db.restoreForm(input.id);
        return { success: true };
      }),
    restoreResponse: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.id);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta n\u00e3o encontrada" });
        }
        await db.restoreResponse(input.id);
        return { success: true };
      }),
    permanentDeleteForm: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formul\u00e1rio n\u00e3o encontrado" });
        }
        if (!form.deletedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Formul\u00e1rio precisa estar na lixeira para exclus\u00e3o definitiva" });
        }
        await db.permanentDeleteForm(input.id);
        return { success: true };
      }),
    permanentDeleteResponse: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const response = await db.getResponseById(input.id);
        if (!response) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resposta n\u00e3o encontrada" });
        }
        if (!response.deletedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Resposta precisa estar na lixeira para exclus\u00e3o definitiva" });
        }
        await db.permanentDeleteResponse(input.id);
        return { success: true };
      }),
    emptyTrash: ownerFallbackProcedure
      .mutation(async ({ ctx }) => {
        const trashedForms = await db.getTrashedForms(ctx.user.id);
        const trashedResponses = await db.getTrashedResponses(ctx.user.id);
        for (const r of trashedResponses) {
          await db.permanentDeleteResponse(r.id);
        }
        for (const f of trashedForms) {
          await db.permanentDeleteForm(f.id);
        }
        return { success: true, deletedForms: trashedForms.length, deletedResponses: trashedResponses.length };
      }),
  }),
});
export type AppRouter = typeof appRouter;


