import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, staffAdminProcedure, staffAnyProcedure, staffFormOwnerProcedure } from "./_core/trpc";
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
import { notifyOwner } from "./_core/notification";
import { notifyOwnerNewResponse, notifyCorretorPush } from "./pushNotification";
import { sendProtocolEmail } from "./emailService";
import { notifyCorretoresNewSubmission } from "./corretorNotification";
import { customAuthRouter } from "./authRouter";
import * as staffDb from "./staffDb";
import { verifySessionToken } from "./authService";
import { sendInviteEmail, sendApprovalEmail, sendRejectionEmail, sendFollowUpEmail, sendCadenceEmail, sendRejectionCadenceEmail } from "./emailService";
import { generateInviteToken } from "./authService";
import { getOrCreateOwnerUser } from "./ownerUser";
import { logAudit, AUDIT_ACTIONS } from "./auditLog";

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
    list: staffAdminProcedure.query(async () => {
      const users = await staffDb.getAllStaffUsers();
      return users.map((u: any) => ({
        id: u.id, email: u.email, name: u.name, phone: u.phone,
        role: u.role, active: u.active, createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn, avatarUrl: u.avatarUrl,
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
        await sendInviteEmail({
          to: input.email,
          inviterName: ctx.user.name || "Administrador",
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

        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
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
        await sendInviteEmail({
          to: invite.email,
          inviterName: ctx.user.name || "Administrador",
          role: invite.role,
          inviteUrl,
        });
        return { success: true };
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

          // Send email notifications based on status
          if (allApproved && response.respondentEmail) {
            await sendApprovalEmail({
              to: response.respondentEmail,
              clientName: response.respondentName || "Cliente",
            });
            // Stop any active cadences for this response
            await db.stopCadencesForResponse(input.responseId, "form_approved");

            // Log overall approval
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
            // Start rejection cadence (3x/week for 2 months)
            await db.createEmailCadence({
              responseId: input.responseId,
              formId: response.formId,
              cadenceType: "reprovacao",
              recipientEmail: response.respondentEmail,
              recipientName: response.respondentName || undefined,
              rejectionReason: reasons,
            });

            // Log overall rejection
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
        }
        return { success: true };
      }),
  }),

  // ─── Forms (admin only: master/diretor/gerente) ───
  forms: router({
    list: staffAdminProcedure.query(async ({ ctx }) => {
      const allForms = await db.getFormsByUser(ctx.user.id);
      const session = ctx.customSession as any;
      // Master/diretor see all forms; gerentes only see assigned forms
      if (session?.role === 'gerente' && session?.staffUserId) {
        const assignedFormIds = await db.getFormIdsByStaff(session.staffUserId);
        if (assignedFormIds.length === 0) return allForms; // If no assignments exist, show all (backward compat)
        return allForms.filter((f: any) => assignedFormIds.includes(f.id));
      }
      return allForms;
    }),

    /** Get assignments for a specific form */
    getAssignments: staffAdminProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getFormAssignments(input.formId);
      }),

    /** Get assignments for multiple forms (batch) */
    getAssignmentsBatch: staffAdminProcedure
      .input(z.object({ formIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return db.getFormAssignmentsBatch(input.formIds);
      }),

    /** Set assignments for a form (replaces existing) */
    setAssignments: staffFormOwnerProcedure
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
      const assignedFormIds = await db.getFormIdsByStaff(session.staffUserId);
      if (assignedFormIds.length === 0) return [];
      // Fetch full form data for each assigned form
      const allForms = await db.getFormsByUser(ctx.user.id);
      return allForms.filter((f: any) => assignedFormIds.includes(f.id));
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getFormBySlug(input.slug);
      }),

    checkSlugAvailable: publicProcedure
      .input(z.object({ slug: z.string(), excludeFormId: z.number().optional() }))
      .query(async ({ input }) => {
        const existing = await db.getFormBySlug(input.slug);
        if (!existing) return { available: true };
        if (input.excludeFormId && existing.id === input.excludeFormId) return { available: true };
        return { available: false };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getFormById(input.id);
      }),

    create: staffFormOwnerProcedure
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
        });
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
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

    update: staffFormOwnerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        questions: z.any().optional(),
        design: z.any().optional(),
        webhook: z.any().optional(),
        sharing: z.any().optional(),
        workspaceId: z.string().nullable().optional(),
        status: z.enum(["draft", "published", "closed"]).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, slug: directSlug, ...data } = input;
        // Verify ownership
        const form = await db.getFormById(id);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        // Handle direct slug update
        if (directSlug) {
          const sanitized = directSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (sanitized) {
            const existing = await db.getFormBySlug(sanitized);
            if (existing && existing.id !== id) {
              throw new TRPCError({ code: 'CONFLICT', message: 'Este slug já está em uso por outro formulário.' });
            }
            (data as any).slug = sanitized;
          }
        }
        // Sync slug from sharing settings to the forms.slug column
        if (data.sharing && typeof data.sharing === 'object' && 'slug' in data.sharing && data.sharing.slug) {
          const newSlug = data.sharing.slug as string;
          const existing = await db.getFormBySlug(newSlug);
          if (existing && existing.id !== id) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Este slug já está em uso por outro formulário.' });
          }
          (data as any).slug = newSlug;
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

        if (Object.keys(syncableFields).length > 0) {
          try {
            const syncResult = await db.syncChildForms(id, syncableFields);
            if (syncResult.synced > 0) {
              console.log(`[FormSync] Synced ${syncResult.synced} child forms of parent ${id}`);
            }
          } catch (err) {
            console.error("[FormSync] Failed to sync child forms:", err);
            // Don't fail the parent update if sync fails
          }
        }

        return { success: true };
      }),

    delete: staffFormOwnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulário não encontrado" });
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

    duplicate: staffFormOwnerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        workspaceId: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const newSlug = `form_${nanoid(10)}`;
        const result = await db.duplicateForm(input.id, ctx.user.id, newSlug, input.title, input.workspaceId);
        const cs = ctx.customSession?.type === 'staff' ? ctx.customSession : null;
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
        });

        // Always notify assigned staff (even for incomplete/partial responses)
        try {
          const form = await db.getFormById(input.formId);
          const formTitle = form?.title ?? "Formulário";
          const respondent = input.respondentName || input.respondentEmail || "Anônimo";
          const isComplete = input.isComplete !== false;
          const statusLabel = isComplete ? "completa" : "parcial (em andamento)";

          // Notify owner (platform + push) — always
          notifyOwner({
            title: `Nova resposta ${isComplete ? "" : "parcial "}: ${formTitle}`,
            content: `O formulário "${formTitle}" recebeu uma resposta ${statusLabel} de ${respondent}.`,
          }).catch((err) => console.warn("[Notification] Owner notify failed:", (err as any)?.message?.substring(0, 100)));
          notifyOwnerNewResponse(formTitle, respondent).catch(() => {});

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

          // Notify corretores via email (old system, only for complete responses)
          if (isComplete && result.protocolCode) {
            const questions: any[] = form?.questions ?? [];
            notifyCorretoresNewSubmission({
              formId: input.formId,
              protocolCode: result.protocolCode,
              formTitle,
              respondentName: input.respondentName ?? undefined,
              respondentEmail: input.respondentEmail ?? undefined,
              answers: input.answers,
              questions,
            }).catch((err) => {
              console.warn("[CorretorNotification] Failed:", (err as Error)?.message?.substring(0, 100));
            });
          }

          // Push notification to old assigned corretor (legacy field)
          if (form?.assignedCorretorId) {
            notifyCorretorPush({
              staffUserId: form.assignedCorretorId,
              formTitle,
              respondentName: input.respondentName ?? undefined,
              protocolCode: result.protocolCode ?? undefined,
              formId: input.formId,
            }).catch((err) => {
              console.warn("[CorretorPush] Failed:", (err as Error)?.message?.substring(0, 100));
            });
          }

          // ─── NEW: Notify ALL assigned staff via form_assignments ───
          // Push + in-app notifications for every staff member assigned to this form
          const assignments = await db.getFormAssignments(input.formId);
          if (assignments.length > 0) {
            const staffIds = assignments.map((a: any) => a.staffUserId);
            const notifTitle = `📋 Nova resposta ${isComplete ? "" : "parcial "}em ${formTitle}`;
            const notifBody = respondent !== "Anônimo"
              ? `${respondent} enviou uma resposta ${statusLabel} no formulário "${formTitle}"`
              : `Nova resposta ${statusLabel} recebida no formulário "${formTitle}"`;

            // In-app notifications (batch insert)
            db.createStaffNotificationsBatch(
              staffIds.map((staffUserId: number) => ({
                staffUserId,
                type: "new_response",
                title: notifTitle,
                body: notifBody,
                link: "/corretor/respostas",
                metadata: {
                  formId: input.formId,
                  formTitle,
                  respondentName: input.respondentName ?? null,
                  protocolCode: result.protocolCode ?? null,
                  isComplete,
                  responseId: result.id,
                },
              }))
            ).catch((err) => console.warn("[InAppNotif] Batch create failed:", (err as any)?.message?.substring(0, 100)));

            // Push notifications to each assigned staff user
            for (const staffUserId of staffIds) {
              // Skip if already notified via legacy assignedCorretorId
              if (form?.assignedCorretorId === staffUserId) continue;
              notifyCorretorPush({
                staffUserId,
                formTitle,
                respondentName: input.respondentName ?? undefined,
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

        return result;
      }),

    listByForm: staffAdminProcedure
      .input(z.object({ formId: z.number(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        return db.getResponsesByFormWithSearch(input.formId, input.search);
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

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        answers: z.any().optional(),
        isComplete: z.boolean().optional(),
        timeSpentSeconds: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateResponse(id, data);

        // Notify owner when a partial response becomes complete
        if (input.isComplete === true) {
          try {
            const response = await db.getResponseById(id);
            if (response) {
              const form = await db.getFormById(response.formId);
              const formTitle = form?.title ?? "Formulário";
              const respondent = response.respondentName || response.respondentEmail || "Anônimo";
              await notifyOwner({
                title: `Nova resposta: ${formTitle}`,
                content: `O formulário "${formTitle}" recebeu uma nova resposta completa de ${respondent}.`,
              });
              // Stop any active abandono cadences for this response
              await db.stopCadencesForResponse(id, "form_completed");

              // Log activity: response completed
              db.logActivity({
                responseId: id,
                formId: response.formId,
                activityType: "response_completed",
                description: `Cadastro completado por ${respondent}`,
              }).catch(() => {});
            }
          } catch (err) {
            console.warn("[Notification] Failed to notify owner:", (err as any)?.message?.substring(0, 100));
          }
        }

        return { success: true };
      }),

    generateFicha: staffAnyProcedure
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

        const { generateCadastroInteressePdf, mergeWithAttachments } = await import("./pdfGenerator");

        // Generate the cadastro PDF
        let pdfBytes = await generateCadastroInteressePdf({
          tipo,
          answers,
          questions,
          respondentName: response.respondentName ?? undefined,
          respondentEmail: response.respondentEmail ?? undefined,
        });

        // Collect file attachments from answers
        const attachments: Array<{ url: string; filename: string; mimeType: string }> = [];
        for (const q of questions) {
          if (q.type === "file-upload" && answers[q.id]) {
            const val = answers[q.id];
            if (typeof val === "object" && val.url) {
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

        // Merge with attachments if any
        if (attachments.length > 0) {
          pdfBytes = await mergeWithAttachments(pdfBytes, attachments);
        }

        // Convert to base64 for transport
        const base64 = Buffer.from(pdfBytes).toString("base64");
        const respondent = response.respondentName || "cadastro";
        const filename = `Ficha_${tipo.toUpperCase()}_${respondent.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").trim()}.pdf`;

        return { base64, filename, tipo };
      }),

    myResponses: publicProcedure
      .query(async ({ ctx }) => {
        // Parse cookie to get client session
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
          filename: `${form.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").trim()}_respostas.csv`,
          totalResponses: responses.length,
        };
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
    subscribe: staffAnyProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.savePushSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: null,
        });
        return { success: true, updated: result.updated };
      }),

    unsubscribe: staffAnyProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    status: staffAnyProcedure
      .query(async ({ ctx }) => {
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.deleteStaffPushSubscription(session.staffUserId, input.endpoint);
        return { success: true };
      }),

    status: publicProcedure
      .query(async ({ ctx }) => {
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
      const cookies = cookie.parse(ctx.req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];
      const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.assignResponseToFolder(input.responseId, input.folderId, session.staffUserId);
        return { success: true };
      }),

    unassign: publicProcedure
      .input(z.object({ responseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
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
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
        if (!session || session.type !== "staff") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de equipe necessário" });
        }
        await db.batchAssignResponsesToFolder(input.responseIds, input.folderId, session.staffUserId);
        return { success: true, count: input.responseIds.length };
      }),

    assignments: publicProcedure.query(async ({ ctx }) => {
      const cookies = cookie.parse(ctx.req.headers.cookie || "");
      const token = cookies[COOKIE_NAME];
      const session = await verifySessionToken(token);
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
          ogImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/formflow-icon-512_f2d6e9c0.png",
          ogUrl: "https://one.cadastrodigital.com.br",
        };
      }
      return {
        ogTitle: settings.ogTitle ?? "Cadastro Digital | One Innovation",
        ogDescription: settings.ogDescription ?? "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.",
        ogImage: settings.ogImage ?? "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/formflow-icon-512_f2d6e9c0.png",
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
});

export type AppRouter = typeof appRouter;


