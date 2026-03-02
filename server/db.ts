import { eq, desc, sql, like, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users,
  forms, InsertForm,
  formResponses, InsertFormResponse,
  formVersions, InsertFormVersion,
  files, InsertFileRecord,
  workspaces, InsertWorkspace,
  pushSubscriptions, InsertPushSubscription,
  corretores, InsertCorretor,
  formCorretores, InsertFormCorretor,
} from "../drizzle/schema";
import { ENV } from './_core/env';

/* ─── Connection Management ─── */

let _pool: mysql.Pool | null = null;
let _db: any = null;
let _poolCreatedAt = 0;

// Max pool age: 5 minutes. After this, recreate the pool to avoid stale connections.
const MAX_POOL_AGE_MS = 5 * 60 * 1000;

/**
 * Create a MySQL2 connection pool with aggressive keepalive and reconnect settings.
 */
function createPool(): mysql.Pool {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5,          // Slightly larger pool for production
    maxIdle: 2,
    idleTimeout: 30000,          // 30s idle timeout
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Keepalive every 10s
    connectTimeout: 20000,       // 20s connection timeout
    ssl: dbUrl.includes('tidbcloud') || dbUrl.includes('ssl=true') ? { rejectUnauthorized: true } : undefined,
  });

  pool.on('connection', () => {
    console.log("[Database] New pool connection established");
  });

  // Handle pool-level errors to prevent crashes
  (pool as any).pool?.on?.('error', (err: any) => {
    console.error("[Database] Pool error:", err?.message?.substring(0, 100));
  });

  return pool;
}

/**
 * Get or create the database instance.
 * Recreates the pool if it's too old to prevent stale connections.
 */
function getDb(): any {
  const now = Date.now();

  // Recreate pool if it's too old
  if (_pool && (now - _poolCreatedAt > MAX_POOL_AGE_MS)) {
    console.log("[Database] Pool expired, recreating...");
    const oldPool = _pool;
    _pool = null;
    _db = null;
    // End old pool in background (don't await)
    oldPool.end().catch(() => {});
  }

  if (!_db) {
    _pool = createPool();
    _db = drizzle(_pool);
    _poolCreatedAt = now;
    console.log("[Database] Connection pool initialized");
  }

  return _db;
}

/**
 * Force-reset the connection pool. Called after connection errors.
 */
function resetPool() {
  if (_pool) {
    const oldPool = _pool;
    _pool = null;
    _db = null;
    // End old pool in background
    oldPool.end().catch(() => {});
    console.log("[Database] Pool reset due to connection error");
  }
}

/**
 * Execute a database operation with automatic retry on connection errors.
 * On failure, resets the pool and retries with a fresh connection.
 */
async function withDbRetry<T>(operation: (db: any) => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = getDb();
      return await operation(db);
    } catch (err: any) {
      const msg = err?.message ?? '';
      const code = err?.code ?? '';
      const isConnectionError =
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'PROTOCOL_CONNECTION_LOST' ||
        code === 'ER_CON_COUNT_ERROR' ||
        msg.includes('ECONNRESET') ||
        msg.includes('Connection lost') ||
        msg.includes('read ECONNRESET') ||
        msg.includes('connect ETIMEDOUT') ||
        msg.includes('Failed query');

      if (isConnectionError && attempt < maxRetries - 1) {
        console.warn(`[Database] Connection error (attempt ${attempt + 1}/${maxRetries}): ${msg.substring(0, 100)}`);
        resetPool();
        // Wait with exponential backoff: 500ms, 1500ms, 3500ms
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withDbRetry: unreachable");
}

/**
 * Warm up the database connection. Call this at server startup.
 * Returns true if the connection is healthy.
 */
export async function warmUpDb(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    console.log("[Database] Warm-up successful");
    return true;
  } catch (err: any) {
    console.warn("[Database] Warm-up failed:", err?.message?.substring(0, 100));
    resetPool();
    return false;
  }
}

/* ─── Users ─── */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  return withDbRetry(async (db) => {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  });
}

export async function getUserByOpenId(openId: string) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  });
}

/* ─── Forms ─── */

export async function createForm(data: InsertForm) {
  return withDbRetry(async (db) => {
    const result = await db.insert(forms).values(data);
    return { id: result[0].insertId };
  });
}

export async function getFormsByUser(userId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.updatedAt));
  });
}

export async function getFormBySlug(slug: string) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);
    return result[0] ?? null;
  });
}

export async function getFormById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateForm(id: number, data: Partial<InsertForm>) {
  return withDbRetry(async (db) => {
    await db.update(forms).set(data).where(eq(forms.id, id));
  });
}

export async function deleteForm(id: number) {
  return withDbRetry(async (db) => {
    await db.delete(formVersions).where(eq(formVersions.formId, id));
    await db.delete(formResponses).where(eq(formResponses.formId, id));
    await db.delete(files).where(eq(files.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  });
}

export async function duplicateForm(
  id: number,
  userId: number,
  newSlug: string,
  customTitle?: string,
  customWorkspaceId?: string | null,
) {
  return withDbRetry(async (db) => {
    const original = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    if (!original[0]) throw new Error("Form not found");
    const o = original[0];
    // Update sharing object with new slug
    const newSharing = o.sharing ? { ...(o.sharing as any), slug: newSlug } : { slug: newSlug };
    const result = await db.insert(forms).values({
      slug: newSlug,
      userId,
      title: customTitle || `${o.title} (cópia)`,
      description: o.description,
      questions: o.questions,
      design: o.design,
      webhook: o.webhook,
      sharing: newSharing,
      workspaceId: customWorkspaceId !== undefined ? customWorkspaceId : o.workspaceId,
      status: "draft",
      color: o.color,
      responseCount: 0,
    });
    return { id: result[0].insertId };
  });
}

/* ─── Form Responses ─── */

/**
 * Generate a unique protocol code: OI-XXXXXX (6 uppercase alphanumeric chars)
 */
function generateProtocolCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OI-${code}`;
}

export async function createResponse(data: InsertFormResponse) {
  return withDbRetry(async (db) => {
    // Generate a unique protocol code with retry for uniqueness
    let protocolCode = generateProtocolCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await db.select({ id: formResponses.id })
        .from(formResponses)
        .where(eq(formResponses.protocolCode, protocolCode))
        .limit(1);
      if (existing.length === 0) break;
      protocolCode = generateProtocolCode(); // Regenerate if collision
    }

    const result = await db.insert(formResponses).values({
      ...data,
      protocolCode,
    });
    await db.update(forms).set({ responseCount: sql`${forms.responseCount} + 1` }).where(eq(forms.id, data.formId));
    return { id: result[0].insertId, protocolCode };
  });
}

export async function getResponsesByForm(formId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.createdAt));
  });
}

export async function getResponsesByFormWithSearch(formId: number, search?: string) {
  return withDbRetry(async (db) => {
    if (!search || search.trim() === "") {
      return db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.createdAt));
    }
    const term = `%${search.trim()}%`;
    return db.select().from(formResponses).where(
      and(
        eq(formResponses.formId, formId),
        or(
          like(formResponses.protocolCode, term),
          like(formResponses.respondentName, term),
          like(formResponses.respondentEmail, term),
        )
      )
    ).orderBy(desc(formResponses.createdAt));
  });
}

export async function getResponsesByCpfCnpj(cpfCnpj: string) {
  return withDbRetry(async (db) => {
    return db.select({
      id: formResponses.id,
      formId: formResponses.formId,
      respondentName: formResponses.respondentName,
      respondentEmail: formResponses.respondentEmail,
      protocolCode: formResponses.protocolCode,
      validationStatus: formResponses.validationStatus,
      isComplete: formResponses.isComplete,
      createdAt: formResponses.createdAt,
      formTitle: forms.title,
    }).from(formResponses)
      .leftJoin(forms, eq(formResponses.formId, forms.id))
      .where(eq(formResponses.respondentCpfCnpj, cpfCnpj))
      .orderBy(desc(formResponses.createdAt));
  });
}

export async function getResponseById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(formResponses).where(eq(formResponses.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateResponse(id: number, data: Partial<InsertFormResponse>) {
  return withDbRetry(async (db) => {
    await db.update(formResponses).set(data).where(eq(formResponses.id, id));
  });
}

/* ─── Form Versions ─── */

export async function createVersion(data: InsertFormVersion) {
  return withDbRetry(async (db) => {
    const result = await db.insert(formVersions).values(data);
    const allVersions = await db.select({ id: formVersions.id })
      .from(formVersions)
      .where(eq(formVersions.formId, data.formId))
      .orderBy(desc(formVersions.createdAt));
    if (allVersions.length > 5) {
      const idsToDelete = allVersions.slice(5).map((v: any) => v.id);
      for (const vid of idsToDelete) {
        await db.delete(formVersions).where(eq(formVersions.id, vid));
      }
    }
    return { id: result[0].insertId };
  });
}

export async function getVersionsByForm(formId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(formVersions).where(eq(formVersions.formId, formId)).orderBy(desc(formVersions.createdAt));
  });
}

export async function getVersionById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(formVersions).where(eq(formVersions.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function deleteVersion(id: number) {
  return withDbRetry(async (db) => {
    await db.delete(formVersions).where(eq(formVersions.id, id));
  });
}

/* ─── Files ─── */

export async function createFileRecord(data: InsertFileRecord) {
  return withDbRetry(async (db) => {
    const result = await db.insert(files).values(data);
    return { id: result[0].insertId };
  });
}

export async function getFilesByForm(formId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(files).where(eq(files.formId, formId)).orderBy(desc(files.createdAt));
  });
}

export async function getFilesByResponse(responseId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(files).where(eq(files.responseId, responseId));
  });
}

export async function deleteFileRecord(id: number) {
  return withDbRetry(async (db) => {
    await db.delete(files).where(eq(files.id, id));
  });
}

/* ─── Workspaces ─── */

export async function createWorkspace(data: InsertWorkspace) {
  return withDbRetry(async (db) => {
    const result = await db.insert(workspaces).values(data);
    return { id: result[0].insertId };
  });
}

export async function getWorkspacesByUser(userId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(workspaces).where(eq(workspaces.userId, userId)).orderBy(desc(workspaces.createdAt));
  });
}

export async function getWorkspaceById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateWorkspace(id: number, data: Partial<InsertWorkspace>) {
  return withDbRetry(async (db) => {
    await db.update(workspaces).set(data).where(eq(workspaces.id, id));
  });
}

export async function deleteWorkspace(id: number) {
  return withDbRetry(async (db) => {
    // Move forms in this workspace to no workspace
    await db.update(forms).set({ workspaceId: null }).where(eq(forms.workspaceId, String(id)));
    await db.delete(workspaces).where(eq(workspaces.id, id));
  });
}

/* ─── Push Subscriptions ─── */

export async function savePushSubscription(data: InsertPushSubscription) {
  return withDbRetry(async (db) => {
    // Check if this endpoint already exists for this user
    const existing = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, data.userId))
      .limit(50);
    
    const match = existing.find((s: any) => s.endpoint === data.endpoint);
    if (match) {
      // Update existing subscription (keys may have changed)
      await db.update(pushSubscriptions).set({
        p256dh: data.p256dh,
        auth: data.auth,
        active: true,
        userAgent: data.userAgent,
      }).where(eq(pushSubscriptions.id, match.id));
      return { id: match.id, updated: true };
    }
    
    const result = await db.insert(pushSubscriptions).values(data);
    return { id: result[0].insertId, updated: false };
  });
}

export async function getActivePushSubscriptions(userId: number) {
  return withDbRetry(async (db) => {
    return db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .limit(50);
  });
}

export async function deletePushSubscription(userId: number, endpoint: string) {
  return withDbRetry(async (db) => {
    const all = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .limit(50);
    const match = all.find((s: any) => s.endpoint === endpoint);
    if (match) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, match.id));
    }
  });
}

export async function deactivatePushSubscription(id: number) {
  return withDbRetry(async (db) => {
    await db.update(pushSubscriptions).set({ active: false }).where(eq(pushSubscriptions.id, id));
  });
}

/* ─── Corretores ─── */

export async function createCorretor(data: InsertCorretor) {
  return withDbRetry(async (db) => {
    const result = await db.insert(corretores).values(data);
    return { id: result[0].insertId };
  });
}

export async function getCorretoresByUser(userId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(corretores).where(eq(corretores.userId, userId)).orderBy(desc(corretores.createdAt));
  });
}

export async function getCorretorById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(corretores).where(eq(corretores.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateCorretor(id: number, data: Partial<InsertCorretor>) {
  return withDbRetry(async (db) => {
    await db.update(corretores).set(data).where(eq(corretores.id, id));
  });
}

export async function deleteCorretor(id: number) {
  return withDbRetry(async (db) => {
    // Also remove all form associations
    await db.delete(formCorretores).where(eq(formCorretores.corretorId, id));
    await db.delete(corretores).where(eq(corretores.id, id));
  });
}

/* ─── Form-Corretor Associations ─── */

export async function getCorretoresByForm(formId: number) {
  return withDbRetry(async (db) => {
    // Join formCorretores with corretores to get full corretor data
    const associations = await db.select().from(formCorretores).where(eq(formCorretores.formId, formId));
    if (associations.length === 0) return [];
    const corretorIds = associations.map((a: any) => a.corretorId);
    const allCorretores = await db.select().from(corretores);
    return allCorretores
      .filter((c: any) => corretorIds.includes(c.id))
      .map((c: any) => ({
        ...c,
        notifyOnSubmission: associations.find((a: any) => a.corretorId === c.id)?.notifyOnSubmission ?? true,
      }));
  });
}

export async function getActiveCorretoresByForm(formId: number) {
  return withDbRetry(async (db) => {
    const associations = await db.select().from(formCorretores)
      .where(and(eq(formCorretores.formId, formId), eq(formCorretores.notifyOnSubmission, true)));
    if (associations.length === 0) return [];
    const corretorIds = associations.map((a: any) => a.corretorId);
    const allCorretores = await db.select().from(corretores);
    return allCorretores.filter((c: any) => corretorIds.includes(c.id) && c.active);
  });
}

export async function setFormCorretores(formId: number, corretorIds: number[]) {
  return withDbRetry(async (db) => {
    // Remove all existing associations for this form
    await db.delete(formCorretores).where(eq(formCorretores.formId, formId));
    // Insert new associations
    if (corretorIds.length > 0) {
      await db.insert(formCorretores).values(
        corretorIds.map((corretorId) => ({
          formId,
          corretorId,
          notifyOnSubmission: true,
        }))
      );
    }
  });
}

export async function toggleFormCorretorNotification(formId: number, corretorId: number, enabled: boolean) {
  return withDbRetry(async (db) => {
    await db.update(formCorretores)
      .set({ notifyOnSubmission: enabled })
      .where(and(eq(formCorretores.formId, formId), eq(formCorretores.corretorId, corretorId)));
  });
}


/* ─── Public Corretores with Forms (for Landing Page) ─── */

/**
 * Returns active corretores that have at least one published form linked.
 * Each corretor includes the slug of their linked form.
 * Used by the public landing page modal.
 */
export async function getPublicCorretoresWithForms() {
  return withDbRetry(async (db) => {
    // Get all active corretores
    const activeCorretores = await db.select().from(corretores).where(eq(corretores.active, true));
    if (activeCorretores.length === 0) return [];

    // Get all form-corretor associations
    const associations = await db.select().from(formCorretores);
    if (associations.length === 0) return [];

    // Get all forms to resolve slugs
    const allForms = await db.select({
      id: forms.id,
      slug: forms.slug,
      title: forms.title,
      status: forms.status,
    }).from(forms);

    // Build result: each corretor with their linked form(s)
    return activeCorretores
      .map((c: any) => {
        const corretorAssocs = associations.filter((a: any) => a.corretorId === c.id);
        const linkedForms = corretorAssocs
          .map((a: any) => allForms.find((f: any) => f.id === a.formId))
          .filter((f: any) => f != null);

        // Pick the first published form, or first form if none published
        const publishedForm = linkedForms.find((f: any) => f.status === 'published') ?? linkedForms[0];

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          avatarUrl: null as string | null,
          staffUserId: c.staffUserId,
          formSlug: publishedForm?.slug ?? null,
          formTitle: publishedForm?.title ?? null,
        };
      })
      .filter((c: any) => c.formSlug != null); // Only return corretores with a linked form
  });
}

/**
 * Returns active staff users with role 'corretor' that have forms assigned to them.
 * Uses the forms.assignedCorretorId field.
 */
export async function getStaffCorretoresWithForms() {
  return withDbRetry(async (db) => {
    // Get active staff corretores
    const { staffUsers } = await import("../drizzle/schema");
    const staffCorretores = await db.select().from(staffUsers)
      .where(and(
        eq(staffUsers.role, 'corretor' as any),
        eq(staffUsers.active, true),
      ));

    if (staffCorretores.length === 0) return [];

    // Get forms assigned to these corretores
    const allForms = await db.select({
      id: forms.id,
      slug: forms.slug,
      title: forms.title,
      status: forms.status,
      assignedCorretorId: forms.assignedCorretorId,
    }).from(forms);

    return staffCorretores
      .map((s: any) => {
        const assignedForms = allForms.filter((f: any) => f.assignedCorretorId === s.id);
        const publishedForm = assignedForms.find((f: any) => f.status === 'published') ?? assignedForms[0];

        return {
          id: s.id,
          name: s.name,
          phone: s.phone,
          email: s.email,
          avatarUrl: s.avatarUrl,
          isStaff: true,
          formSlug: publishedForm?.slug ?? null,
          formTitle: publishedForm?.title ?? null,
        };
      })
      .filter((c: any) => c.formSlug != null);
  });
}
