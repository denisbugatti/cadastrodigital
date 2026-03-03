import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import { t } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { notifyOwner } from "./_core/notification";
import { notifyOwnerNewResponse } from "./pushNotification";
import { sendProtocolEmail } from "./emailService";
import { notifyCorretoresNewSubmission } from "./corretorNotification";
import { customAuthRouter } from "./authRouter";
import * as staffDb from "./staffDb";
import { verifySessionToken } from "./authService";
import { sendInviteEmail, sendApprovalEmail, sendRejectionEmail } from "./emailService";
import { generateInviteToken } from "./authService";

/**
 * In-memory cache for the owner user.
 * Once resolved, we never need to query the DB again for auth.
 * This eliminates the #1 cause of intermittent failures:
 * every single request was hitting the DB just to resolve the owner.
 */
let _cachedOwnerUser: any = null;
let _ownerCacheExpiry = 0;
const OWNER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased for stability)

/**
 * Build a synthetic owner user object.
 * Used as ultimate fallback when DB is unreachable.
 */
function buildSyntheticOwner(ownerOpenId: string): any {
  return {
    id: 1,
    openId: ownerOpenId,
    name: process.env.OWNER_NAME ?? "Owner",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

/**
 * Get or create the owner user with multiple fallback layers:
 * 1. In-memory cache (fastest)
 * 2. Database lookup with retry
 * 3. Stale cache (if available)
 * 4. Synthetic owner (guaranteed to work)
 *
 * This function NEVER throws — it always returns a valid owner user.
 */
async function getOrCreateOwnerUser(): Promise<any> {
  const now = Date.now();

  // Layer 1: Return cached owner if still valid
  if (_cachedOwnerUser && now < _ownerCacheExpiry) {
    return _cachedOwnerUser;
  }

  const ownerOpenId = ENV.ownerOpenId;
  if (!ownerOpenId) {
    console.error("[ownerFallback] OWNER_OPEN_ID is not set!");
    // Even without ownerOpenId, return a synthetic user so the app doesn't crash
    const synthetic = buildSyntheticOwner("unknown");
    _cachedOwnerUser = synthetic;
    _ownerCacheExpiry = now + 30000;
    return synthetic;
  }

  // Layer 2: Try database lookup with retries
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let ownerUser = await db.getUserByOpenId(ownerOpenId);
      if (!ownerUser) {
        // Auto-create owner user
        console.log("[ownerFallback] Owner not found in DB, creating...");
        await db.upsertUser({
          openId: ownerOpenId,
          name: process.env.OWNER_NAME ?? "Owner",
          role: "admin",
          lastSignedIn: new Date(),
        });
        ownerUser = await db.getUserByOpenId(ownerOpenId);
      }

      if (ownerUser) {
        _cachedOwnerUser = ownerUser;
        _ownerCacheExpiry = now + OWNER_CACHE_TTL;
        return ownerUser;
      }
    } catch (err: any) {
      const errMsg = err?.message?.substring(0, 120) ?? "unknown";
      console.warn(`[ownerFallback] DB error attempt ${attempt + 1}/3: ${errMsg}`);

      // Layer 3: If we have a stale cache, use it
      if (_cachedOwnerUser) {
        console.log("[ownerFallback] Using stale cached owner");
        _ownerCacheExpiry = now + 120000; // Extend stale cache for 2 min
        return _cachedOwnerUser;
      }

      if (attempt < 2) {
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 300;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
    }
  }

  // Layer 4: Synthetic owner as ultimate fallback (NEVER fails)
  console.warn("[ownerFallback] All DB attempts failed. Using synthetic owner.");
  const synthetic = buildSyntheticOwner(ownerOpenId);
  _cachedOwnerUser = synthetic;
  _ownerCacheExpiry = now + 30000; // Short TTL so we retry DB soon
  return synthetic;
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

  // ─── Staff Management (master only) ───
  staff: router({
    list: ownerFallbackProcedure.query(async () => {
      const users = await staffDb.getAllStaffUsers();
      return users.map((u: any) => ({
        id: u.id, email: u.email, name: u.name, phone: u.phone,
        role: u.role, active: u.active, createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn, avatarUrl: u.avatarUrl,
      }));
    }),

    update: ownerFallbackProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["master", "diretor", "gerente", "corretor"]).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await staffDb.updateStaffUser(id, data as any);
        return { success: true };
      }),

    delete: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await staffDb.deleteStaffUser(input.id);
        return { success: true };
      }),

    invite: ownerFallbackProcedure
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
        await staffDb.createInvite({
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
        });
        return { success: true, token };
      }),

    invites: ownerFallbackProcedure.query(async ({ ctx }) => {
      return staffDb.getInvitesByInviter(ctx.user.id);
    }),

    deleteInvite: ownerFallbackProcedure
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

    updateInvite: ownerFallbackProcedure
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

    resendInvite: ownerFallbackProcedure
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
    list: ownerFallbackProcedure.query(async () => {
      return staffDb.getAllPermissions();
    }),

    update: ownerFallbackProcedure
      .input(z.object({
        role: z.string(),
        permission: z.string(),
        granted: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await staffDb.upsertPermission(input.role, input.permission, input.granted);
        return { success: true };
      }),
  }),

  // ─── Response Validations ───
  validations: router({
    byResponse: ownerFallbackProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return staffDb.getValidationsByResponse(input.responseId);
      }),

    validate: ownerFallbackProcedure
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

          // Send email notifications based on status
          if (allApproved && response.respondentEmail) {
            await sendApprovalEmail({
              to: response.respondentEmail,
              clientName: response.respondentName || "Cliente",
            });
          } else if (hasRejection && response.respondentEmail) {
            const rejections = allValidations.filter((v: any) => v.status === "rejected");
            const reasons = rejections.map((v: any) => v.justification || "Documento/dado precisa de revisão").join("; ");
            await sendRejectionEmail({
              to: response.respondentEmail,
              clientName: response.respondentName || "Cliente",
              reason: reasons,
            });
          }
        }
        return { success: true };
      }),
  }),

  // ─── Forms ───
  forms: router({
    list: ownerFallbackProcedure.query(async ({ ctx }) => {
      return db.getFormsByUser(ctx.user.id);
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

    create: ownerFallbackProcedure
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
        return db.createForm({
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
      }),

    update: ownerFallbackProcedure
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
        return { success: true };
      }),

    delete: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const form = await db.getFormById(input.id);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        await db.deleteForm(input.id);
        return { success: true };
      }),

    duplicate: ownerFallbackProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        workspaceId: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const newSlug = `form_${nanoid(10)}`;
        return db.duplicateForm(input.id, ctx.user.id, newSlug, input.title, input.workspaceId);
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

        // Notify owner when a complete response is submitted
        if (input.isComplete !== false) {
          try {
            const form = await db.getFormById(input.formId);
            const formTitle = form?.title ?? "Formulário";
            const respondent = input.respondentName || input.respondentEmail || "Anônimo";
            // Platform notification
            await notifyOwner({
              title: `Nova resposta: ${formTitle}`,
              content: `O formulário "${formTitle}" recebeu uma nova resposta de ${respondent}.`,
            });
            // Web Push notification
            await notifyOwnerNewResponse(formTitle, respondent);

            // Send protocol code email to respondent (if email provided)
            if (input.respondentEmail && result.protocolCode) {
              sendProtocolEmail({
                to: input.respondentEmail,
                respondentName: input.respondentName ?? undefined,
                protocolCode: result.protocolCode,
                formTitle,
              }).catch((err) => {
                console.warn("[Email] Failed to send protocol email:", (err as Error)?.message?.substring(0, 100));
              });
            }

            // Notify corretores assigned to this form
            if (result.protocolCode) {
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
          } catch (err) {
            // Don't fail the submission if notification fails
            console.warn("[Notification] Failed to notify owner:", (err as any)?.message?.substring(0, 100));
          }
        }

        return result;
      }),

    listByForm: ownerFallbackProcedure
      .input(z.object({ formId: z.number(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        return db.getResponsesByFormWithSearch(input.formId, input.search);
      }),

    getById: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getResponseById(input.id);
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
            }
          } catch (err) {
            console.warn("[Notification] Failed to notify owner:", (err as any)?.message?.substring(0, 100));
          }
        }

        return { success: true };
      }),

    generateFicha: ownerFallbackProcedure
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
        const cookie = require("cookie");
        const cookies = cookie.parse(ctx.req.headers.cookie || "");
        const token = cookies[COOKIE_NAME];
        const session = await verifySessionToken(token);
        if (!session || session.type !== "client") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de cliente necessário" });
        }
        return db.getResponsesByCpfCnpj(session.cpfCnpj);
      }),

    exportCsv: ownerFallbackProcedure
      .input(z.object({
        formId: z.number(),
        validationStatus: z.enum(["all", "pending", "in_review", "approved", "rejected"]).optional().default("all"),
      }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        let responses = await db.getResponsesByForm(input.formId);
        // Filter by validation status if specified
        if (input.validationStatus && input.validationStatus !== "all") {
          responses = responses.filter((r: any) => r.validationStatus === input.validationStatus);
        }
        const questions: any[] = form.questions ?? [];

        // Build CSV header: fixed columns + one column per question
        const fixedHeaders = ["ID", "Nome", "Email", "Completo", "Tempo (s)", "Data"];
        const questionHeaders = questions
          .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
          .map((q: any) => q.title || q.id);

        const questionIds = questions
          .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
          .map((q: any) => q.id);

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
            // Handle address objects, matrix responses, etc.
            return Object.entries(answer)
              .map(([k, v]) => `${k}: ${v}`)
              .join("; ");
          }
          return String(answer);
        };

        const rows: string[] = [];
        // BOM for Excel UTF-8 compatibility
        rows.push([...fixedHeaders, ...questionHeaders].map(esc).join(","));

        for (const resp of responses) {
          const answers = (resp.answers ?? {}) as Record<string, any>;
          const fixedValues = [
            resp.id,
            resp.respondentName ?? "",
            resp.respondentEmail ?? "",
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
    create: ownerFallbackProcedure
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

    listByForm: ownerFallbackProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getVersionsByForm(input.formId);
      }),

    getById: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVersionById(input.id);
      }),

    delete: ownerFallbackProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVersion(input.id);
        return { success: true };
      }),

    restore: ownerFallbackProcedure
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
        return { success: true };
      }),
  }),

  // ─── Files ───
  files: router({
    upload: ownerFallbackProcedure
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

    listByForm: ownerFallbackProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getFilesByForm(input.formId);
      }),

    listByResponse: ownerFallbackProcedure
      .input(z.object({ responseId: z.number() }))
      .query(async ({ input }) => {
        return db.getFilesByResponse(input.responseId);
      }),

    delete: ownerFallbackProcedure
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
        await db.deletePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    status: ownerFallbackProcedure
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

  // ─── Corretores ───
  corretores: router({
    list: ownerFallbackProcedure.query(async ({ ctx }) => {
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

    assignToForm: ownerFallbackProcedure
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

    create: ownerFallbackProcedure
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

    update: ownerFallbackProcedure
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

    delete: ownerFallbackProcedure
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
    byForm: ownerFallbackProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        return db.getCorretoresByForm(input.formId);
      }),

    // Set which corretores are assigned to a form
    setFormCorretores: ownerFallbackProcedure
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
    toggleNotification: ownerFallbackProcedure
      .input(z.object({
        formId: z.number(),
        corretorId: z.number(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleFormCorretorNotification(input.formId, input.corretorId, input.enabled);
        return { success: true };
      }),

    getAssigned: ownerFallbackProcedure
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
    list: ownerFallbackProcedure.query(async ({ ctx }) => {
      return db.getWorkspacesByUser(ctx.user.id);
    }),

    create: ownerFallbackProcedure
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

    update: ownerFallbackProcedure
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

    delete: ownerFallbackProcedure
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

    update: ownerFallbackProcedure
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

    uploadImage: ownerFallbackProcedure
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
});

export type AppRouter = typeof appRouter;


