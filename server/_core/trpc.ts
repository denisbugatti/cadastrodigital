import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG, FORBIDDEN_CORRETOR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getOrCreateOwnerUser } from "../ownerUser";

export const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware that requires the user to be a staff member with admin-level role.
 * Blocks corretores from accessing admin procedures.
 * Allowed roles: master, diretor, gerente (NOT corretor).
 *
 * If ctx.user is null but customSession exists (DB failed in context.ts),
 * we use getOrCreateOwnerUser() as fallback — this function NEVER fails.
 */
const ADMIN_ROLES = ['master', 'diretor', 'gerente'];

const requireStaffAdmin = t.middleware(async ({ ctx, next }) => {
  let user = ctx.user;

  // If user is null but customSession exists, the DB lookup in context.ts failed.
  // Use the robust getOrCreateOwnerUser() fallback (never fails).
  if (!user && ctx.customSession) {
    user = await getOrCreateOwnerUser();
  }

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // If custom session exists, check the staff role
  if (ctx.customSession) {
    if (ctx.customSession.type !== 'staff') {
      throw new TRPCError({ code: "FORBIDDEN", message: FORBIDDEN_CORRETOR_MSG });
    }
    if (!ADMIN_ROLES.includes(ctx.customSession.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: FORBIDDEN_CORRETOR_MSG });
    }
  }
  // If no customSession but user exists (Manus OAuth owner), allow through

  return next({ ctx: { ...ctx, user } });
});

/**
 * staffAdminProcedure: Requires staff with admin-level role (master/diretor/gerente).
 * Corretores are blocked from these procedures.
 */
export const staffAdminProcedure = t.procedure.use(requireStaffAdmin);

/**
 * Middleware that requires any authenticated staff member (including corretores).
 * Used for procedures that corretores need access to (validations, their own responses).
 */
const requireStaffAny = t.middleware(async ({ ctx, next }) => {
  let user = ctx.user;

  // If user is null but customSession exists, the DB lookup in context.ts failed.
  // Use the robust getOrCreateOwnerUser() fallback (never fails).
  if (!user && ctx.customSession) {
    user = await getOrCreateOwnerUser();
  }

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.customSession && ctx.customSession.type !== 'staff') {
    throw new TRPCError({ code: "FORBIDDEN", message: 'Acesso restrito a membros da equipe' });
  }

  return next({ ctx: { ...ctx, user } });
});

/**
 * staffAnyProcedure: Requires any staff member (master/diretor/gerente/corretor).
 */
export const staffAnyProcedure = t.procedure.use(requireStaffAny);
