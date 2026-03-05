import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG, FORBIDDEN_CORRETOR_MSG, FORBIDDEN_GERENTE_FORMS_MSG } from '@shared/const';
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
 * Helper: resolve user with owner fallback.
 * If ctx.user is null but customSession exists (DB failed in context.ts),
 * we use getOrCreateOwnerUser() as fallback — this function NEVER fails.
 */
async function resolveUser(ctx: TrpcContext) {
  if (ctx.user) return ctx.user;
  if (ctx.customSession) {
    return await getOrCreateOwnerUser();
  }
  return null;
}

/**
 * Middleware that requires the user to be a staff member with admin-level role.
 * Blocks corretores from accessing admin procedures.
 * Allowed roles: master, diretor, gerente (NOT corretor).
 */
const ADMIN_ROLES = ['master', 'diretor', 'gerente'];

const requireStaffAdmin = t.middleware(async ({ ctx, next }) => {
  const user = await resolveUser(ctx);

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
 * Middleware that requires master or diretor role.
 * Used for form creation, editing, deletion — gerentes can only VIEW forms.
 * Allowed roles: master, diretor (NOT gerente, NOT corretor).
 */
const FORM_OWNER_ROLES = ['master', 'diretor'];

const requireStaffFormOwner = t.middleware(async ({ ctx, next }) => {
  const user = await resolveUser(ctx);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.customSession) {
    if (ctx.customSession.type !== 'staff') {
      throw new TRPCError({ code: "FORBIDDEN", message: FORBIDDEN_CORRETOR_MSG });
    }
    if (!FORM_OWNER_ROLES.includes(ctx.customSession.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: FORBIDDEN_GERENTE_FORMS_MSG });
    }
  }
  // If no customSession but user exists (Manus OAuth owner), allow through

  return next({ ctx: { ...ctx, user } });
});

/**
 * staffFormOwnerProcedure: Requires master or diretor role.
 * Used for form CRUD operations. Gerentes are blocked (they can only view).
 */
export const staffFormOwnerProcedure = t.procedure.use(requireStaffFormOwner);

/**
 * Middleware that requires any authenticated staff member (including corretores).
 * Used for procedures that corretores need access to (validations, their own responses).
 */
const requireStaffAny = t.middleware(async ({ ctx, next }) => {
  const user = await resolveUser(ctx);

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
