/**
 * Database helpers for the custom auth system:
 * staff users, client users, invites, permissions, response validations.
 */

import { eq, desc, and, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  staffUsers, InsertStaffUser,
  clientUsers, InsertClientUser,
  invites, InsertInvite,
  rolePermissions, InsertRolePermission,
  responseValidations, InsertResponseValidation,
} from "../drizzle/schema";

/* ─── Connection (reuse from db.ts pattern) ─── */

let _pool: mysql.Pool | null = null;
let _db: any = null;
let _poolCreatedAt = 0;
const MAX_POOL_AGE_MS = 5 * 60 * 1000;

function createPool(): mysql.Pool {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
    ssl: dbUrl.includes('tidbcloud') || dbUrl.includes('ssl=true') ? { rejectUnauthorized: true } : undefined,
  });
}

function getDb(): any {
  const now = Date.now();
  if (_pool && (now - _poolCreatedAt > MAX_POOL_AGE_MS)) {
    const oldPool = _pool;
    _pool = null;
    _db = null;
    oldPool.end().catch(() => {});
  }
  if (!_db) {
    _pool = createPool();
    _db = drizzle(_pool);
    _poolCreatedAt = now;
  }
  return _db;
}

function resetPool() {
  if (_pool) {
    const oldPool = _pool;
    _pool = null;
    _db = null;
    oldPool.end().catch(() => {});
  }
}

async function withRetry<T>(operation: (db: any) => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = getDb();
      return await operation(db);
    } catch (err: any) {
      const msg = err?.message ?? '';
      const code = err?.code ?? '';
      const isConnectionError =
        code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' ||
        code === 'PROTOCOL_CONNECTION_LOST' || msg.includes('ECONNRESET') ||
        msg.includes('Connection lost') || msg.includes('Failed query');
      if (isConnectionError && attempt < maxRetries - 1) {
        resetPool();
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: unreachable");
}

/* ─── Staff Users ─── */

export async function createStaffUser(data: InsertStaffUser) {
  return withRetry(async (db) => {
    const result = await db.insert(staffUsers).values(data);
    return { id: result[0].insertId };
  });
}

export async function getStaffUserByEmail(email: string) {
  return withRetry(async (db) => {
    const result = await db.select().from(staffUsers).where(eq(staffUsers.email, email.toLowerCase())).limit(1);
    return result[0] ?? null;
  });
}

export async function getStaffUserById(id: number) {
  return withRetry(async (db) => {
    const result = await db.select().from(staffUsers).where(eq(staffUsers.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateStaffUser(id: number, data: Partial<InsertStaffUser>) {
  return withRetry(async (db) => {
    await db.update(staffUsers).set(data).where(eq(staffUsers.id, id));
  });
}

export async function getAllStaffUsers() {
  return withRetry(async (db) => {
    return db.select().from(staffUsers).orderBy(desc(staffUsers.createdAt));
  });
}

export async function getStaffUsersByRole(role: string) {
  return withRetry(async (db) => {
    return db.select().from(staffUsers).where(eq(staffUsers.role, role as any)).orderBy(staffUsers.name);
  });
}

/** Get all corretores invited by a specific manager (gerente) */
export async function getCorretoresByManager(managerId: number) {
  return withRetry(async (db) => {
    return db.select().from(staffUsers)
      .where(and(eq(staffUsers.invitedBy, managerId), eq(staffUsers.role, 'corretor')))
      .orderBy(staffUsers.name);
  });
}

export async function deleteStaffUser(id: number) {
  return withRetry(async (db) => {
    await db.delete(staffUsers).where(eq(staffUsers.id, id));
  });
}

/* ─── Client Users ─── */

export async function createClientUser(data: InsertClientUser) {
  return withRetry(async (db) => {
    const result = await db.insert(clientUsers).values(data);
    return { id: result[0].insertId };
  });
}

export async function getClientUserByCpfCnpj(cpfCnpj: string) {
  return withRetry(async (db) => {
    const result = await db.select().from(clientUsers).where(eq(clientUsers.cpfCnpj, cpfCnpj)).limit(1);
    return result[0] ?? null;
  });
}

export async function getClientUserById(id: number) {
  return withRetry(async (db) => {
    const result = await db.select().from(clientUsers).where(eq(clientUsers.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateClientUser(id: number, data: Partial<InsertClientUser>) {
  return withRetry(async (db) => {
    await db.update(clientUsers).set(data).where(eq(clientUsers.id, id));
  });
}

/* ─── Invites ─── */

export async function createInvite(data: InsertInvite) {
  return withRetry(async (db) => {
    const result = await db.insert(invites).values(data);
    return { id: result[0].insertId };
  });
}

export async function getInviteByToken(token: string) {
  return withRetry(async (db) => {
    const result = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
    return result[0] ?? null;
  });
}

export async function getInvitesByInviter(invitedBy: number) {
  return withRetry(async (db) => {
    return db.select().from(invites).where(eq(invites.invitedBy, invitedBy)).orderBy(desc(invites.createdAt));
  });
}

export async function markInviteUsed(id: number) {
  return withRetry(async (db) => {
    await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.id, id));
  });
}

export async function deleteInvite(id: number) {
  return withRetry(async (db) => {
    await db.delete(invites).where(eq(invites.id, id));
  });
}

export async function updateInvite(id: number, data: { email?: string; role?: string; name?: string | null; phone?: string | null; token?: string; expiresAt?: Date }) {
  return withRetry(async (db) => {
    await db.update(invites).set(data).where(eq(invites.id, id));
  });
}

export async function getInviteById(id: number) {
  return withRetry(async (db) => {
    const result = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
    return result[0] ?? null;
  });
}

/* ─── Role Permissions ─── */

export async function getAllPermissions() {
  return withRetry(async (db) => {
    return db.select().from(rolePermissions).orderBy(rolePermissions.role, rolePermissions.permission);
  });
}

export async function getPermissionsByRole(role: string) {
  return withRetry(async (db) => {
    return db.select().from(rolePermissions).where(eq(rolePermissions.role, role as any));
  });
}

export async function upsertPermission(role: string, permission: string, granted: boolean) {
  return withRetry(async (db) => {
    // Check if exists
    const existing = await db.select().from(rolePermissions)
      .where(and(eq(rolePermissions.role, role as any), eq(rolePermissions.permission, permission)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(rolePermissions).set({ granted }).where(eq(rolePermissions.id, existing[0].id));
    } else {
      await db.insert(rolePermissions).values({ role: role as any, permission, granted });
    }
  });
}

export async function seedDefaultPermissions() {
  const defaults: { role: string; permission: string; granted: boolean }[] = [
    // Master — all permissions
    { role: "master", permission: "view_all_leads", granted: true },
    { role: "master", permission: "view_team_leads", granted: true },
    { role: "master", permission: "view_own_leads", granted: true },
    { role: "master", permission: "filter_responsible", granted: true },
    { role: "master", permission: "edit_leads", granted: true },
    { role: "master", permission: "delete_leads", granted: true },
    { role: "master", permission: "bulk_actions", granted: true },
    { role: "master", permission: "view_team_profiles", granted: true },
    { role: "master", permission: "manage_forms", granted: true },
    { role: "master", permission: "manage_users", granted: true },
    { role: "master", permission: "manage_permissions", granted: true },
    { role: "master", permission: "view_analytics", granted: true },
    { role: "master", permission: "export_data", granted: true },
    // Diretor
    { role: "diretor", permission: "view_all_leads", granted: true },
    { role: "diretor", permission: "view_team_leads", granted: true },
    { role: "diretor", permission: "view_own_leads", granted: true },
    { role: "diretor", permission: "filter_responsible", granted: true },
    { role: "diretor", permission: "edit_leads", granted: true },
    { role: "diretor", permission: "delete_leads", granted: true },
    { role: "diretor", permission: "bulk_actions", granted: true },
    { role: "diretor", permission: "view_team_profiles", granted: true },
    { role: "diretor", permission: "manage_forms", granted: true },
    { role: "diretor", permission: "manage_users", granted: false },
    { role: "diretor", permission: "manage_permissions", granted: false },
    { role: "diretor", permission: "view_analytics", granted: true },
    { role: "diretor", permission: "export_data", granted: true },
    // Gerente
    { role: "gerente", permission: "view_all_leads", granted: false },
    { role: "gerente", permission: "view_team_leads", granted: true },
    { role: "gerente", permission: "view_own_leads", granted: true },
    { role: "gerente", permission: "filter_responsible", granted: true },
    { role: "gerente", permission: "edit_leads", granted: true },
    { role: "gerente", permission: "delete_leads", granted: false },
    { role: "gerente", permission: "bulk_actions", granted: true },
    { role: "gerente", permission: "view_team_profiles", granted: true },
    { role: "gerente", permission: "manage_forms", granted: false },
    { role: "gerente", permission: "manage_users", granted: false },
    { role: "gerente", permission: "manage_permissions", granted: false },
    { role: "gerente", permission: "view_analytics", granted: false },
    { role: "gerente", permission: "export_data", granted: false },
    // Corretor
    { role: "corretor", permission: "view_all_leads", granted: false },
    { role: "corretor", permission: "view_team_leads", granted: false },
    { role: "corretor", permission: "view_own_leads", granted: true },
    { role: "corretor", permission: "filter_responsible", granted: false },
    { role: "corretor", permission: "edit_leads", granted: true },
    { role: "corretor", permission: "delete_leads", granted: false },
    { role: "corretor", permission: "bulk_actions", granted: false },
    { role: "corretor", permission: "view_team_profiles", granted: false },
    { role: "corretor", permission: "manage_forms", granted: false },
    { role: "corretor", permission: "manage_users", granted: false },
    { role: "corretor", permission: "manage_permissions", granted: false },
    { role: "corretor", permission: "view_analytics", granted: false },
    { role: "corretor", permission: "export_data", granted: false },
  ];

  for (const perm of defaults) {
    await upsertPermission(perm.role, perm.permission, perm.granted);
  }
}

/* ─── Response Validations ─── */

export async function createResponseValidation(data: InsertResponseValidation) {
  return withRetry(async (db) => {
    const result = await db.insert(responseValidations).values(data);
    return { id: result[0].insertId };
  });
}

export async function getValidationsByResponse(responseId: number) {
  return withRetry(async (db) => {
    return db.select().from(responseValidations).where(eq(responseValidations.responseId, responseId));
  });
}

export async function updateValidation(id: number, data: Partial<InsertResponseValidation>) {
  return withRetry(async (db) => {
    await db.update(responseValidations).set(data).where(eq(responseValidations.id, id));
  });
}

export async function upsertValidation(
  responseId: number,
  questionId: string,
  status: "pending" | "approved" | "rejected",
  validatedBy: number,
  justification?: string,
) {
  return withRetry(async (db) => {
    const existing = await db.select().from(responseValidations)
      .where(and(
        eq(responseValidations.responseId, responseId),
        eq(responseValidations.questionId, questionId),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(responseValidations).set({
        status: status as any,
        justification: justification ?? null,
        validatedBy,
        validatedAt: new Date(),
      }).where(eq(responseValidations.id, existing[0].id));
      return { id: existing[0].id, updated: true };
    }

    const result = await db.insert(responseValidations).values({
      responseId,
      questionId,
      status: status as any,
      justification: justification ?? null,
      validatedBy,
      validatedAt: new Date(),
    });
    return { id: result[0].insertId, updated: false };
  });
}

export async function deleteValidationsByResponse(responseId: number) {
  return withRetry(async (db) => {
    await db.delete(responseValidations).where(eq(responseValidations.responseId, responseId));
  });
}
