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

/**
 * In-memory cache for the owner user.
 * Once resolved, we never need to query the DB again for auth.
 * This eliminates the #1 cause of intermittent failures:
 * every single request was hitting the DB just to resolve the owner.
 */
let _cachedOwnerUser: any = null;
let _ownerCacheExpiry = 0;
const OWNER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getOrCreateOwnerUser(): Promise<any> {
  const now = Date.now();

  // Return cached owner if still valid
  if (_cachedOwnerUser && now < _ownerCacheExpiry) {
    return _cachedOwnerUser;
  }

  const ownerOpenId = ENV.ownerOpenId;
  if (!ownerOpenId) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner not configured" });
  }

  // Try up to 2 times with a short delay between attempts
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let ownerUser = await db.getUserByOpenId(ownerOpenId);
      if (!ownerUser) {
        // Auto-create owner user
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
      console.warn(`[ownerFallback] DB error attempt ${attempt + 1}/2:`, err?.message?.substring(0, 80));
      // If cache exists but expired, use stale cache as fallback
      if (_cachedOwnerUser) {
        _ownerCacheExpiry = now + 60000; // Extend stale cache for 60s
        return _cachedOwnerUser;
      }
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
        continue;
      }
      throw err;
    }
  }

  // Final fallback: create a synthetic owner user so the app doesn't break
  // This allows the app to at least render while DB recovers
  if (!_cachedOwnerUser) {
    console.warn("[ownerFallback] Creating synthetic owner user as last resort");
    _cachedOwnerUser = {
      id: 1,
      openId: ownerOpenId,
      name: process.env.OWNER_NAME ?? "Owner",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    _ownerCacheExpiry = now + 30000; // Short TTL so we retry DB soon
    return _cachedOwnerUser;
  }

  return _cachedOwnerUser;
}

/**
 * ownerFallbackProcedure:
 * If the user is authenticated, use their id.
 * If not authenticated, fall back to the cached owner user.
 * This allows the app to work without login — all data belongs to the owner.
 */
const ownerFallbackProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  try {
    const ownerUser = await getOrCreateOwnerUser();
    return next({ ctx: { ...ctx, user: ownerUser } });
  } catch (err: any) {
    console.error("[ownerFallback] Failed:", err?.message?.substring(0, 100));
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro temporário de conexão. Tente novamente em alguns segundos.",
    });
  }
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
        const { id, ...data } = input;
        // Verify ownership
        const form = await db.getFormById(id);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
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
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const newSlug = `form_${nanoid(10)}`;
        return db.duplicateForm(input.id, ctx.user.id, newSlug);
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
            await notifyOwner({
              title: `Nova resposta: ${formTitle}`,
              content: `O formulário "${formTitle}" recebeu uma nova resposta de ${respondent}.`,
            });
          } catch (err) {
            // Don't fail the submission if notification fails
            console.warn("[Notification] Failed to notify owner:", (err as any)?.message?.substring(0, 100));
          }
        }

        return result;
      }),

    listByForm: ownerFallbackProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new Error("Form not found or access denied");
        }
        return db.getResponsesByForm(input.formId);
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

    exportCsv: ownerFallbackProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const form = await db.getFormById(input.formId);
        if (!form || form.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const responses = await db.getResponsesByForm(input.formId);
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
});

export type AppRouter = typeof appRouter;


