/**
 * Auth Router — Custom authentication endpoints for staff and client users.
 * Replaces Manus OAuth for the platform's own login system.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { DEFAULT_SITE_URL } from "../shared/brands";
import { getSessionCookieOptions } from "./_core/cookies";
import * as staffDb from "./staffDb";
import { logAudit, AUDIT_ACTIONS } from "./auditLog";
import {
  hashPassword,
  verifyPassword,
  createStaffSessionToken,
  createClientSessionToken,
  verifySessionToken,
  generateInviteToken,
  cleanCpfCnpj,
  isValidCpfCnpj,
  revokeToken,
} from "./authService";
import { parse as parseCookieHeader } from "cookie";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { passwordResetTokens } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendPasswordResetEmail } from "./emailService";
import { ENV } from "./_core/env";

// Lazy DB for password reset tokens
let _resetDb: ReturnType<typeof drizzle> | null = null;
function getResetDb(): ReturnType<typeof drizzle> {
  if (!_resetDb) {
    const pool = createPool(ENV.databaseUrl);
    _resetDb = drizzle(pool);
  }
  return _resetDb;
}

export const customAuthRouter = router({
  /**
   * Get current user info from session cookie.
   * Returns staff or client user data, or null if not authenticated.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const cookies = parseCookies(ctx.req.headers.cookie);
    let token = cookies.get(COOKIE_NAME);
    // Fallback: read token from Authorization header (for iframe/preview contexts where cookies are blocked)
    if (!token) {
      const authHeader = ctx.req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }
    const session = await verifySessionToken(token);

    if (!session) return null;

    if (session.type === "staff") {
      const user = await staffDb.getStaffUserById(session.staffUserId);
      if (!user || !user.active) return null;
      // Get permissions for this role
      const permissions = await staffDb.getPermissionsByRole(user.role);
      const permMap: Record<string, boolean> = {};
      for (const p of permissions) {
        permMap[p.permission] = p.granted;
      }
      return {
        type: "staff" as const,
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        cpfCnpj: user.cpfCnpj ?? null,
        avatarUrl: user.avatarUrl,
        permissions: permMap,
      };
    }

    if (session.type === "client") {
      const user = await staffDb.getClientUserById(session.clientUserId);
      if (!user) return null;
      return {
        type: "client" as const,
        id: user.id,
        cpfCnpj: user.cpfCnpj,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      };
    }

    return null;
  }),

  /**
   * Staff login — email + password
   */
  staffLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await staffDb.getStaffUserByEmail(input.email.toLowerCase());
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
      }
      if (!user.active) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada. Entre em contato com o administrador." });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
      }

      // Update last signed in
      await staffDb.updateStaffUser(user.id, { lastSignedIn: new Date() });

      // Create session token
      const token = await createStaffSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Get permissions
      const permissions = await staffDb.getPermissionsByRole(user.role);
      const permMap: Record<string, boolean> = {};
      for (const p of permissions) {
        permMap[p.permission] = p.granted;
      }

      logAudit({
        action: AUDIT_ACTIONS.ACCESS_LOGIN,
        staffUserId: user.id,
        staffName: user.name,
        staffRole: user.role,
        details: { email: user.email },
      });

      return {
        success: true,
        token, // Return token so frontend can store in localStorage as fallback for iframe contexts
        user: {
          type: "staff" as const,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: permMap,
        },
      };
    }),

  /**
   * Client login — CPF/CNPJ + password
   */
  clientLogin: publicProcedure
    .input(z.object({
      cpfCnpj: z.string().min(11),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const clean = cleanCpfCnpj(input.cpfCnpj);
      if (!isValidCpfCnpj(clean)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CPF ou CNPJ inválido" });
      }

      const user = await staffDb.getClientUserByCpfCnpj(clean);
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "CPF/CNPJ ou senha incorretos" });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "CPF/CNPJ ou senha incorretos" });
      }

      await staffDb.updateClientUser(user.id, { lastSignedIn: new Date() });

      const token = await createClientSessionToken({
        id: user.id,
        cpfCnpj: user.cpfCnpj,
        name: user.name,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        token, // Return token so frontend can store in localStorage as fallback for iframe contexts
        user: {
          type: "client" as const,
          id: user.id,
          cpfCnpj: user.cpfCnpj,
          name: user.name,
          email: user.email,
        },
      };
    }),

  /**
   * Client registration — CPF/CNPJ + password + name + email
   */
  clientRegister: publicProcedure
    .input(z.object({
      cpfCnpj: z.string().min(11),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const clean = cleanCpfCnpj(input.cpfCnpj);
      if (!isValidCpfCnpj(clean)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CPF ou CNPJ inválido" });
      }

      // Check if already exists
      const existing = await staffDb.getClientUserByCpfCnpj(clean);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Este CPF/CNPJ já está cadastrado" });
      }

      const passwordHash = await hashPassword(input.password);
      const { id } = await staffDb.createClientUser({
        cpfCnpj: clean,
        passwordHash,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
      });

      const token = await createClientSessionToken({
        id,
        cpfCnpj: clean,
        name: input.name,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        token, // Return token so frontend can store in localStorage as fallback for iframe contexts
        user: {
          type: "client" as const,
          id,
          cpfCnpj: clean,
          name: input.name,
        },
      };
    }),

  /**
   * Accept invite — staff user sets their password
   */
  acceptInvite: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      name: z.string().min(2).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invite = await staffDb.getInviteByToken(input.token);
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado ou já utilizado" });
      }
      if (invite.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite já foi utilizado" });
      }
      if (new Date() > invite.expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite expirou" });
      }

      // Check if email already has an account
      const existing = await staffDb.getStaffUserByEmail(invite.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Este email já possui uma conta" });
      }

      const passwordHash = await hashPassword(input.password);
      const { id } = await staffDb.createStaffUser({
        email: invite.email.toLowerCase(),
        passwordHash,
        name: input.name || invite.name || invite.email.split("@")[0],
        phone: invite.phone ?? null,
        role: invite.role as any,
        active: true,
        invitedBy: invite.invitedBy,
      });

      await staffDb.markInviteUsed(invite.id);

      // If the invite has an auto-created form, assign it to the new staff user
      if ((invite as any).formId) {
        try {
          const { updateForm, assignStaffToForm } = await import("./db");
          // Legacy field
          await updateForm((invite as any).formId, { assignedCorretorId: id });
          // New: insert into form_assignments table (used by "Vincular Equipe" UI)
          await assignStaffToForm((invite as any).formId, id, invite.invitedBy);
          console.log(`[AcceptInvite] Form ${(invite as any).formId} assigned to staff ${id} via formAssignments`);
        } catch (err) {
          console.error("[AcceptInvite] Failed to assign form to corretor:", err);
        }
      }

      const token = await createStaffSessionToken({
        id,
        email: invite.email,
        role: invite.role,
        name: input.name || invite.name || invite.email.split("@")[0],
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        token, // Return token so frontend can store in localStorage as fallback for iframe contexts
        user: {
          type: "staff" as const,
          id,
          email: invite.email,
          name: input.name || invite.name || invite.email.split("@")[0],
          role: invite.role,
        },
      };
    }),

  /**
   * Get invite details (for the accept-invite page)
   */
  getInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invite = await staffDb.getInviteByToken(input.token);
      if (!invite) return null;
      return {
        email: invite.email,
        role: invite.role,
        name: invite.name,
        expired: new Date() > invite.expiresAt,
        used: !!invite.usedAt,
      };
    }),

  /**
   * Update own profile — staff user can update their CPF/CNPJ, name, phone
   */
  updateMyProfile: publicProcedure
    .input(z.object({
      cpfCnpj: z.string().optional(),
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const cookies = parseCookies(ctx.req.headers.cookie);
      let token = cookies.get(COOKIE_NAME);
      if (!token) {
        const authHeader = ctx.req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        }
      }
      const session = await verifySessionToken(token);
      if (!session || session.type !== "staff") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      const updateData: Record<string, any> = {};
      if (input.cpfCnpj !== undefined) {
        const clean = cleanCpfCnpj(input.cpfCnpj);
        if (clean && !isValidCpfCnpj(clean)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CPF ou CNPJ inválido" });
        }
        updateData.cpfCnpj = clean || null;
      }
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phone !== undefined) updateData.phone = input.phone;

      if (Object.keys(updateData).length > 0) {
        await staffDb.updateStaffUser(session.staffUserId, updateData);
      }

      return { success: true };
    }),

  /**
   * Change password — authenticated staff user changes their own password
   */
  changePassword: publicProcedure
    .input(z.object({
      currentPassword: z.string().min(1, "Informe a senha atual"),
      newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      const cookies = parseCookies(ctx.req.headers.cookie);
      let token = cookies.get(COOKIE_NAME);
      if (!token) {
        const authHeader = ctx.req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.slice(7);
        }
      }
      const session = await verifySessionToken(token);
      if (!session || session.type !== "staff") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }
      const user = await staffDb.getStaffUserById(session.staffUserId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }
      // Verify current password
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
      }
      // Hash and save new password
      const newHash = await hashPassword(input.newPassword);
      await staffDb.updateStaffUser(user.id, { passwordHash: newHash });
      return { success: true };
    }),

  /**
   * Request password reset — send reset link via email
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Always return success to avoid email enumeration
      const user = await staffDb.getStaffUserByEmail(input.email);
      if (!user || !user.active) {
        return { success: true };
      }

      const db = getResetDb();
      // Invalidate any existing tokens for this user
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.staffUserId, user.id));

      // Create new token (expires in 30 minutes)
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await db.insert(passwordResetTokens).values({
        staffUserId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Build reset URL using a placeholder — frontend will pass origin
      // We store the token; the frontend constructs the URL
      // Send email
      const resetUrl = `${process.env.VITE_OAUTH_PORTAL_URL || DEFAULT_SITE_URL}/redefinir-senha?token=${token}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      return { success: true };
    }),

  /**
   * Reset password — validate token and set new password
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      const db = getResetDb();
      const now = new Date();

      // Find valid, unused, non-expired token
      const rows = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Link inválido ou expirado. Solicite um novo link de redefinição.",
        });
      }

      const resetRecord = rows[0];

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      // Hash and save new password
      const newHash = await hashPassword(input.newPassword);
      await staffDb.updateStaffUser(resetRecord.staffUserId, { passwordHash: newHash });

      return { success: true };
    }),

  /**
   * Logout — clear session cookie and revoke token in DB
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    // Extract token from cookie or Authorization header
    const cookies = parseCookies(ctx.req.headers.cookie);
    let token = cookies.get(COOKIE_NAME);
    if (!token) {
      const authHeader = ctx.req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }
    // Revoke the token in the database so it cannot be reused via Authorization header
    if (token) {
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await revokeToken(token, oneYearFromNow).catch(() => {}); // Fire-and-forget, don't block logout
    }
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// Helper to parse cookies from header
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}
