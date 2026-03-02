/**
 * Auth Router — Custom authentication endpoints for staff and client users.
 * Replaces Manus OAuth for the platform's own login system.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as staffDb from "./staffDb";
import {
  hashPassword,
  verifyPassword,
  createStaffSessionToken,
  createClientSessionToken,
  verifySessionToken,
  generateInviteToken,
  cleanCpfCnpj,
  isValidCpfCnpj,
} from "./authService";

export const customAuthRouter = router({
  /**
   * Get current user info from session cookie.
   * Returns staff or client user data, or null if not authenticated.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const cookies = parseCookies(ctx.req.headers.cookie);
    const token = cookies.get(COOKIE_NAME);
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

      return {
        success: true,
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
   * Logout — clear session cookie
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// Helper to parse cookies from header
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const { parse } = require("cookie");
  const parsed = parse(cookieHeader);
  return new Map(Object.entries(parsed));
}
