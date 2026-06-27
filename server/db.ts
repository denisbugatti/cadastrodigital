import { eq, desc, asc, sql, like, or, and, isNull, isNotNull, lte, gte, inArray, count, avg } from "drizzle-orm";
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
  siteSettings, InsertSiteSettings,
  emailCadence, InsertEmailCadence,
  activityLog, InsertActivityLog,
  staffPushSubscriptions, InsertStaffPushSubscription,
  responseFolders, InsertResponseFolder,
  responseFolderAssignments, InsertResponseFolderAssignment,
  responseValidations,
  staffUsers,
  staffNotifications, InsertStaffNotification,
  staffNotificationPreferences, InsertStaffNotificationPreference,
  integrationLogs, InsertIntegrationLog,
  smsLogs, InsertSmsLog,
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
export function getDb(): any {
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
    return db.select().from(forms).where(and(eq(forms.userId, userId), isNull(forms.deletedAt))).orderBy(desc(forms.updatedAt));
  });
}

export async function getFormBySlug(slug: string, brand?: string) {
  return withDbRetry(async (db) => {
    // Slug is unique per brand. A missing/unknown host-brand (apex, www, test host) resolves
    // to the default brand 'one'. Forms with no explicit sharing.brand are treated as 'one'.
    const b = brand || "one";
    const result = await db.select().from(forms).where(and(
      eq(forms.slug, slug),
      isNull(forms.deletedAt),
      sql`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.brand')), 'one') = ${b}`,
    )).orderBy(asc(forms.id)).limit(1);
    return result[0] ?? null;
  });
}

export async function getFormById(id: number) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    return result[0] ?? null;
  });
}

/** All forms flagged as gallery templates (isTemplate=true), newest first. */
export async function listTemplateForms() {
  return withDbRetry(async (db) => {
    return db.select().from(forms).where(and(eq(forms.isTemplate, true), isNull(forms.deletedAt))).orderBy(desc(forms.updatedAt));
  });
}

/** The default/template form for a brand (sharing.isBrandDefault === true), or null. */
export async function getBrandDefaultForm(brand: string) {
  return withDbRetry(async (db) => {
    const result = await db.select().from(forms).where(and(
      isNull(forms.deletedAt),
      sql`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.brand')), 'one') = ${brand}`,
      sql`JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.isBrandDefault')) = 'true'`,
    )).orderBy(desc(forms.updatedAt), desc(forms.id)).limit(1);
    return result[0] ?? null;
  });
}

/** Clears the brand-default flag on every other form of the same brand (keeps a single default). */
export async function clearBrandDefault(brand: string, exceptFormId: number) {
  return withDbRetry(async (db) => {
    await db.update(forms)
      .set({ sharing: sql`JSON_SET(COALESCE(${forms.sharing}, JSON_OBJECT()), '$.isBrandDefault', false)` } as any)
      .where(and(
        sql`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.brand')), 'one') = ${brand}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.isBrandDefault')) = 'true'`,
        sql`${forms.id} <> ${exceptFormId}`,
      ));
  });
}

export async function updateForm(id: number, data: Partial<InsertForm>) {
  return withDbRetry(async (db) => {
    await db.update(forms).set(data).where(eq(forms.id, id));
  });
}

/** Soft delete — moves form to trash (sets deletedAt). Also soft-deletes its responses. */
export async function deleteForm(id: number) {
  return withDbRetry(async (db) => {
    const now = new Date();
    await db.update(formResponses).set({ deletedAt: now }).where(eq(formResponses.formId, id));
    await db.update(forms).set({ deletedAt: now }).where(eq(forms.id, id));
  });
}

/** Permanently delete a form and all its related data (versions, responses, files). */
export async function permanentDeleteForm(id: number) {
  return withDbRetry(async (db) => {
    await db.delete(formVersions).where(eq(formVersions.formId, id));
    await db.delete(formResponses).where(eq(formResponses.formId, id));
    await db.delete(files).where(eq(files.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  });
}

/** Restore a soft-deleted form (and its responses). */
export async function restoreForm(id: number) {
  return withDbRetry(async (db) => {
    await db.update(forms).set({ deletedAt: null }).where(eq(forms.id, id));
    await db.update(formResponses).set({ deletedAt: null }).where(eq(formResponses.formId, id));
  });
}

/** Soft delete a single response. */
export async function softDeleteResponse(id: number) {
  return withDbRetry(async (db) => {
    await db.update(formResponses).set({ deletedAt: new Date() }).where(eq(formResponses.id, id));
  });
}

/** Restore a soft-deleted response. */
export async function restoreResponse(id: number) {
  return withDbRetry(async (db) => {
    await db.update(formResponses).set({ deletedAt: null }).where(eq(formResponses.id, id));
  });
}

/** Permanently delete a single response and its files. */
export async function permanentDeleteResponse(id: number) {
  return withDbRetry(async (db) => {
    await db.delete(files).where(eq(files.responseId, id));
    await db.delete(formResponses).where(eq(formResponses.id, id));
  });
}

/** Get all soft-deleted forms for the trash view. */
export async function getTrashedForms(userId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(forms).where(and(eq(forms.userId, userId), isNotNull(forms.deletedAt))).orderBy(desc(forms.deletedAt));
  });
}

/** Get all soft-deleted responses for the trash view. */
export async function getTrashedResponses(userId: number) {
  return withDbRetry(async (db) => {
    return db.select({
      id: formResponses.id,
      formId: formResponses.formId,
      respondentName: formResponses.respondentName,
      respondentEmail: formResponses.respondentEmail,
      protocolCode: formResponses.protocolCode,
      isComplete: formResponses.isComplete,
      deletedAt: formResponses.deletedAt,
      createdAt: formResponses.createdAt,
      formTitle: forms.title,
    }).from(formResponses)
      .leftJoin(forms, eq(formResponses.formId, forms.id))
      .where(and(
        eq(forms.userId, userId),
        isNotNull(formResponses.deletedAt),
      ))
      .orderBy(desc(formResponses.deletedAt));
  });
}

export async function duplicateForm(
  id: number,
  userId: number,
  newSlug: string,
  customTitle?: string,
  customWorkspaceId?: string | null,
  /** When true, the copy is linked to the source (parentFormId) so it syncs on edit. */
  linkToParent?: boolean,
) {
  return withDbRetry(async (db) => {
    const original = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    if (!original[0]) throw new Error("Form not found");
    const o = original[0];
    // Update sharing object with new slug; a copy never inherits the brand-default flag
    const { isBrandDefault: _omitDef, ...srcSharing } = (o.sharing as any) ?? {};
    const newSharing = { ...srcSharing, slug: newSlug, isBrandDefault: false };
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
      parentFormId: linkToParent ? id : null,
    });
    return { id: result[0].insertId };
  });
}

/**
 * Duplicate a form specifically for a corretor.
 * Creates a published copy with the corretor's name as title and slug,
 * and assigns the form to the corretor via assignedCorretorId.
 */
export async function duplicateFormForCorretor(
  sourceFormId: number,
  userId: number,
  corretorName: string,
  staffUserId: number,
) {
  return withDbRetry(async (db) => {
    const original = await db.select().from(forms).where(eq(forms.id, sourceFormId)).limit(1);
    if (!original[0]) throw new Error("Source form not found");
    const o = original[0];

    // Generate slug from corretor name: lowercase, replace spaces with hyphens, remove special chars
    const baseSlug = corretorName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-"); // spaces to hyphens

    // Slug must be unique within the copy's brand only (same slug allowed across brands)
    const copyBrand = ((o.sharing as any)?.brand) === "vitacon" ? "vitacon" : "one";
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await db.select({ id: forms.id }).from(forms).where(and(
        eq(forms.slug, slug),
        isNull(forms.deletedAt),
        sql`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${forms.sharing}, '$.brand')), 'one') = ${copyBrand}`,
      )).limit(1);
      if (!existing[0]) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // A corretor copy never inherits the brand-default flag
    const { isBrandDefault: _omitDef, ...srcSharing } = (o.sharing as any) ?? {};
    const newSharing = { ...srcSharing, slug, isBrandDefault: false };
    const result = await db.insert(forms).values({
      slug,
      userId,
      title: corretorName,
      description: o.description,
      questions: o.questions,
      design: o.design,
      webhook: o.webhook,
      sharing: newSharing,
      workspaceId: o.workspaceId,
      status: "published",
      color: o.color,
      responseCount: 0,
      assignedCorretorId: staffUserId,
      parentFormId: sourceFormId,
    });
    return { id: result[0].insertId, slug };
  });
}

/**
 * Get the main published form (One Innovation) — the first published form by the owner.
 */
export async function getMainPublishedForm(userId: number) {
  return withDbRetry(async (db) => {
    const result = await db.select()
      .from(forms)
      .where(
        and(
          eq(forms.userId, userId),
          eq(forms.status, "published"),
          isNull(forms.assignedCorretorId),
          isNull(forms.parentFormId),
          isNull(forms.deletedAt)
        )
      )
      .orderBy(forms.createdAt)
      .limit(1);
    return result[0] ?? null;
  });
}

/**
 * Get all child forms (copies) of a parent form.
 */
export async function getChildForms(parentFormId: number) {
  return withDbRetry(async (db) => {
    return db.select().from(forms).where(eq(forms.parentFormId, parentFormId));
  });
}

/**
 * Sync changes from a parent form to all its child copies.
 * Propagates: questions, design, description, webhook, color, workspaceId, status.
 * Preserves: title, slug, assignedCorretorId, parentFormId, responseCount, sharing (slug part).
 */
export async function syncChildForms(parentFormId: number, syncData: {
  questions?: any;
  design?: any;
  description?: string | null;
  webhook?: any;
  color?: string | null;
  status?: string;
}) {
  return withDbRetry(async (db) => {
    const children = await db.select().from(forms).where(eq(forms.parentFormId, parentFormId));
    if (children.length === 0) return { synced: 0 };

    // Build update data — only include fields that were actually changed
    const updateData: Record<string, any> = {};
    if (syncData.questions !== undefined) updateData.questions = syncData.questions;
    if (syncData.design !== undefined) updateData.design = syncData.design;
    if (syncData.description !== undefined) updateData.description = syncData.description;
    if (syncData.webhook !== undefined) updateData.webhook = syncData.webhook;
    if (syncData.color !== undefined) updateData.color = syncData.color;
    if (syncData.status !== undefined) updateData.status = syncData.status;

    if (Object.keys(updateData).length === 0) return { synced: 0 };

    // Update all children at once
    await db.update(forms)
      .set(updateData)
      .where(eq(forms.parentFormId, parentFormId));

    return { synced: children.length };
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
    // Generate protocol code ONLY for complete responses
    let protocolCode: string | null = null;
    if (data.isComplete !== false) {
      protocolCode = generateProtocolCode();
      for (let attempt = 0; attempt < 3; attempt++) {
        const existing = await db.select({ id: formResponses.id })
          .from(formResponses)
          .where(eq(formResponses.protocolCode, protocolCode))
          .limit(1);
        if (existing.length === 0) break;
        protocolCode = generateProtocolCode(); // Regenerate if collision
      }
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
    return db.select().from(formResponses).where(and(eq(formResponses.formId, formId), isNull(formResponses.deletedAt))).orderBy(desc(formResponses.createdAt));
  });
}

export async function getResponsesByFormWithSearch(formId: number, search?: string) {
  return withDbRetry(async (db) => {
    const baseFilter = and(eq(formResponses.formId, formId), isNull(formResponses.deletedAt));
    if (!search || search.trim() === "") {
      return db.select().from(formResponses).where(baseFilter).orderBy(desc(formResponses.createdAt));
    }
    const term = `%${search.trim()}%`;
    return db.select().from(formResponses).where(
      and(
        baseFilter,
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
      formSlug: forms.slug,
    }).from(formResponses)
      .leftJoin(forms, eq(formResponses.formId, forms.id))
      .where(and(eq(formResponses.respondentCpfCnpj, cpfCnpj), isNull(formResponses.deletedAt)))
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
    // If marking as complete, generate a protocol code if not already set
    let protocolCode: string | null | undefined = data.protocolCode;
    if (data.isComplete === true) {
      const existing = await db.select({ protocolCode: formResponses.protocolCode })
        .from(formResponses)
        .where(eq(formResponses.id, id))
        .limit(1);
      const currentProtocol = existing[0]?.protocolCode;
      if (!currentProtocol) {
        // Generate a unique protocol code
        let newCode = generateProtocolCode();
        for (let attempt = 0; attempt < 3; attempt++) {
          const collision = await db.select({ id: formResponses.id })
            .from(formResponses)
            .where(eq(formResponses.protocolCode, newCode))
            .limit(1);
          if (collision.length === 0) break;
          newCode = generateProtocolCode();
        }
        protocolCode = newCode;
      } else {
        protocolCode = currentProtocol;
      }
    }
    // Auto-sync respondentName from answers when answers is provided and respondentName is not explicitly set
    let autoName: string | undefined;
    if (data.answers && !data.respondentName) {
      const ans = data.answers as Record<string, unknown>;
      for (const [k, v] of Object.entries(ans)) {
        if ((k.toLowerCase().includes('nome') || k.toLowerCase().includes('name')) && typeof v === 'string' && v.trim()) {
          autoName = v.trim();
          break;
        }
      }
    }
    const updateData = {
      ...(protocolCode !== undefined ? { ...data, protocolCode } : data),
      ...(autoName ? { respondentName: autoName } : {}),
    };
    await db.update(formResponses).set(updateData).where(eq(formResponses.id, id));
    return { protocolCode: protocolCode ?? null };
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

/* ─── Staff Push Subscriptions ─── */

export async function saveStaffPushSubscription(data: InsertStaffPushSubscription) {
  return withDbRetry(async (db) => {
    const existing = await db.select()
      .from(staffPushSubscriptions)
      .where(eq(staffPushSubscriptions.staffUserId, data.staffUserId))
      .limit(50);
    
    const match = existing.find((s: any) => s.endpoint === data.endpoint);
    if (match) {
      await db.update(staffPushSubscriptions).set({
        p256dh: data.p256dh,
        auth: data.auth,
        active: true,
        userAgent: data.userAgent,
      }).where(eq(staffPushSubscriptions.id, match.id));
      return { id: match.id, updated: true };
    }
    const result = await db.insert(staffPushSubscriptions).values(data);
    return { id: result[0].insertId, updated: false };
  });
}

export async function getActiveStaffPushSubscriptions(staffUserId: number) {
  return withDbRetry(async (db) => {
    return db.select()
      .from(staffPushSubscriptions)
      .where(eq(staffPushSubscriptions.staffUserId, staffUserId))
      .limit(50);
  });
}

export async function deleteStaffPushSubscription(staffUserId: number, endpoint: string) {
  return withDbRetry(async (db) => {
    const all = await db.select()
      .from(staffPushSubscriptions)
      .where(eq(staffPushSubscriptions.staffUserId, staffUserId))
      .limit(50);
    const match = all.find((s: any) => s.endpoint === endpoint);
    if (match) {
      await db.delete(staffPushSubscriptions).where(eq(staffPushSubscriptions.id, match.id));
    }
  });
}

export async function deactivateStaffPushSubscription(id: number) {
  return withDbRetry(async (db) => {
    await db.update(staffPushSubscriptions).set({ active: false }).where(eq(staffPushSubscriptions.id, id));
  });
}

/** Get all active push subscriptions across all staff users (for broadcast notifications) */
export async function getAllActiveStaffPushSubscriptions() {
  return withDbRetry(async (db) => {
    return db.select().from(staffPushSubscriptions).where(eq(staffPushSubscriptions.active, true));
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


/* ─── Site Settings ─── */

export async function getSiteSettings() {
  return withDbRetry(async (db) => {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, "default")).limit(1);
    return result.length > 0 ? result[0] : null;
  });
}

export async function upsertSiteSettings(data: {
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogUrl?: string | null;
}) {
  return withDbRetry(async (db) => {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, "default")).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettings)
        .set({
          ogTitle: data.ogTitle ?? existing[0].ogTitle,
          ogDescription: data.ogDescription ?? existing[0].ogDescription,
          ogImage: data.ogImage ?? existing[0].ogImage,
          ogUrl: data.ogUrl ?? existing[0].ogUrl,
        })
        .where(eq(siteSettings.key, "default"));
    } else {
      await db.insert(siteSettings).values({
        key: "default",
        ogTitle: data.ogTitle ?? "Cadastro Digital | One Innovation",
        ogDescription: data.ogDescription ?? "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.",
        ogImage: data.ogImage ?? null,
        ogUrl: data.ogUrl ?? "https://one.cadastrodigital.com.br",
      });
    }
  });
}


// ─── Follow-up for Incomplete Responses ───

/**
 * Get incomplete responses that haven't received a follow-up email yet.
 * Only returns responses older than `minAgeHours` hours to give users time to finish.
 * Only returns responses with an email address.
 */
export async function getIncompleteResponsesForFollowUp(minAgeHours: number = 24): Promise<{
  id: number;
  formId: number;
  respondentName: string | null;
  respondentEmail: string | null;
  formTitle: string;
  formSlug: string | null;
  createdAt: Date;
}[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - minAgeHours * 60 * 60 * 1000);
  
  const results = await db
    .select({
      id: formResponses.id,
      formId: formResponses.formId,
      respondentName: formResponses.respondentName,
      respondentEmail: formResponses.respondentEmail,
      formTitle: forms.title,
      formSlug: forms.slug,
      createdAt: formResponses.createdAt,
    })
    .from(formResponses)
    .innerJoin(forms, eq(formResponses.formId, forms.id))
    .where(
      and(
        eq(formResponses.isComplete, false),
        isNull(formResponses.followUpSentAt),
        isNotNull(formResponses.respondentEmail),
        lte(formResponses.createdAt, cutoff),
        eq(forms.status, "published"),
        isNull(formResponses.deletedAt),
        isNull(forms.deletedAt),
      )
    )
    .limit(100);
  
  return results;
}

/**
 * Mark a response as having received a follow-up email.
 */
export async function markFollowUpSent(responseId: number): Promise<void> {
  const db = getDb();
  await db
    .update(formResponses)
    .set({ followUpSentAt: new Date() })
    .where(eq(formResponses.id, responseId));
}


/* ═══════════════════════════════════════════════════════════════
   Email Cadence Helpers
   ═══════════════════════════════════════════════════════════════ */

/**
 * Calculate the next send date for a cadence email.
 * Schedule: Monday (1), Wednesday (3), Friday (5) at 9:00 BRT (12:00 UTC).
 * If starting fresh, waits until 9am BRT of the next valid day.
 */
export function calculateNextCadenceSendDate(fromDate?: Date): Date {
  const now = fromDate || new Date();
  // BRT = UTC-3, so 9am BRT = 12:00 UTC
  const TARGET_HOUR_UTC = 12;
  
  // Start from tomorrow at 9am BRT
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(TARGET_HOUR_UTC, 0, 0, 0);
  
  // Find the next Mon/Wed/Fri
  const VALID_DAYS = [1, 3, 5]; // Monday, Wednesday, Friday
  while (!VALID_DAYS.includes(next.getUTCDay())) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  
  return next;
}

/**
 * Create a new email cadence for a response.
 */
export async function createEmailCadence(params: {
  responseId: number;
  formId: number;
  cadenceType: "abandono" | "reprovacao";
  recipientEmail: string;
  recipientName?: string;
  rejectionReason?: string;
}): Promise<number> {
  const db = getDb();
  
  // Check if an active cadence already exists for this response and type
  const existing = await db
    .select({ id: emailCadence.id })
    .from(emailCadence)
    .where(
      and(
        eq(emailCadence.responseId, params.responseId),
        eq(emailCadence.cadenceType, params.cadenceType),
        eq(emailCadence.active, true),
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    console.log(`[Cadence] Active cadence already exists for response ${params.responseId} (type: ${params.cadenceType})`);
    return existing[0].id;
  }
  
  const nextSendAt = calculateNextCadenceSendDate();
  
  const result = await db.insert(emailCadence).values({
    responseId: params.responseId,
    formId: params.formId,
    cadenceType: params.cadenceType,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName || null,
    rejectionReason: params.rejectionReason || null,
    sequenceNumber: 0,
    maxSequence: 24, // 3/week × 8 weeks = 24
    nextSendAt,
    active: true,
  });
  
  console.log(`[Cadence] Created ${params.cadenceType} cadence for response ${params.responseId}, next send: ${nextSendAt.toISOString()}`);
  return (result as any)[0]?.insertId || 0;
}

/**
 * Get all cadences that are due to be sent now.
 */
export async function getDueCadences(): Promise<Array<{
  id: number;
  responseId: number;
  formId: number;
  cadenceType: "abandono" | "reprovacao";
  recipientEmail: string;
  recipientName: string | null;
  rejectionReason: string | null;
  sequenceNumber: number;
  maxSequence: number;
  formTitle: string;
  formSlug: string | null;
}>> {
  const db = getDb();
  const now = new Date();
  
  const results = await db
    .select({
      id: emailCadence.id,
      responseId: emailCadence.responseId,
      formId: emailCadence.formId,
      cadenceType: emailCadence.cadenceType,
      recipientEmail: emailCadence.recipientEmail,
      recipientName: emailCadence.recipientName,
      rejectionReason: emailCadence.rejectionReason,
      sequenceNumber: emailCadence.sequenceNumber,
      maxSequence: emailCadence.maxSequence,
      formTitle: forms.title,
      formSlug: forms.slug,
    })
    .from(emailCadence)
    .innerJoin(forms, eq(emailCadence.formId, forms.id))
    .where(
      and(
        eq(emailCadence.active, true),
        isNotNull(emailCadence.nextSendAt),
        lte(emailCadence.nextSendAt, now),
      )
    )
    .limit(100);
  
  return results as any;
}

/**
 * Advance a cadence after sending an email.
 * Calculates the next send date or marks as complete.
 */
export async function advanceCadence(cadenceId: number): Promise<void> {
  const db = getDb();
  
  // Get current state
  const [cadence] = await db
    .select()
    .from(emailCadence)
    .where(eq(emailCadence.id, cadenceId))
    .limit(1);
  
  if (!cadence) return;
  
  const newSequence = cadence.sequenceNumber + 1;
  
  if (newSequence >= cadence.maxSequence) {
    // Cadence complete
    await db
      .update(emailCadence)
      .set({
        sequenceNumber: newSequence,
        lastSentAt: new Date(),
        nextSendAt: null,
        active: false,
        stoppedReason: "max_reached",
      })
      .where(eq(emailCadence.id, cadenceId));
    console.log(`[Cadence] Cadence ${cadenceId} completed (${newSequence}/${cadence.maxSequence})`);
  } else {
    // Calculate next send date
    const nextSendAt = calculateNextCadenceSendDate();
    await db
      .update(emailCadence)
      .set({
        sequenceNumber: newSequence,
        lastSentAt: new Date(),
        nextSendAt,
      })
      .where(eq(emailCadence.id, cadenceId));
  }
}

/**
 * Stop a cadence with a reason.
 */
export async function stopCadence(
  cadenceId: number,
  reason: "completed" | "form_completed" | "form_approved" | "manual" | "max_reached"
): Promise<void> {
  const db = getDb();
  await db
    .update(emailCadence)
    .set({
      active: false,
      nextSendAt: null,
      stoppedReason: reason,
    })
    .where(eq(emailCadence.id, cadenceId));
  console.log(`[Cadence] Stopped cadence ${cadenceId} (reason: ${reason})`);
}

/**
 * Stop all active cadences for a response (e.g., when form is completed or approved).
 */
export async function stopCadencesForResponse(
  responseId: number,
  reason: "form_completed" | "form_approved" | "manual"
): Promise<number> {
  const db = getDb();
  const result = await db
    .update(emailCadence)
    .set({
      active: false,
      nextSendAt: null,
      stoppedReason: reason,
    })
    .where(
      and(
        eq(emailCadence.responseId, responseId),
        eq(emailCadence.active, true),
      )
    );
  return (result as any)[0]?.affectedRows || 0;
}

/**
 * Get active cadences count (for dashboard stats).
 */
export async function getActiveCadencesCount(): Promise<{
  abandono: number;
  reprovacao: number;
  total: number;
}> {
  const db = getDb();
  const results = await db
    .select({
      cadenceType: emailCadence.cadenceType,
      count: sql<number>`COUNT(*)`,
    })
    .from(emailCadence)
    .where(eq(emailCadence.active, true))
    .groupBy(emailCadence.cadenceType);
  
  const abandono = results.find((r: any) => r.cadenceType === "abandono")?.count || 0;
  const reprovacao = results.find((r: any) => r.cadenceType === "reprovacao")?.count || 0;
  
  return { abandono, reprovacao, total: abandono + reprovacao };
}

/**
 * Get cadences for a specific response (for admin view).
 */
export async function getCadencesByResponse(responseId: number) {
  const db = getDb();
  return db
    .select()
    .from(emailCadence)
    .where(eq(emailCadence.responseId, responseId))
    .orderBy(desc(emailCadence.createdAt));
}

/**
 * Get response IDs that have active cadences for a given form.
 * Used for the cadence filter in the responses panel.
 */
export async function getResponseIdsWithActiveCadence(formId: number): Promise<number[]> {
  const db = getDb();
  const results = await db
    .selectDistinct({ responseId: emailCadence.responseId })
    .from(emailCadence)
    .where(
      and(
        eq(emailCadence.formId, formId),
        eq(emailCadence.active, true)
      )
    );
  return results.map((r: { responseId: number }) => r.responseId);
}

/**
 * Get response IDs that have any cadence (active or stopped) for a given form.
 */
export async function getResponseIdsWithAnyCadence(formId: number): Promise<number[]> {
  const db = getDb();
  const results = await db
    .selectDistinct({ responseId: emailCadence.responseId })
    .from(emailCadence)
    .where(eq(emailCadence.formId, formId));
  return results.map((r: { responseId: number }) => r.responseId);
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITY LOG — Timeline tracking for response events
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Log an activity event for a response.
 */
export async function logActivity(data: {
  responseId: number;
  formId: number;
  activityType: InsertActivityLog["activityType"];
  description?: string;
  metadata?: Record<string, any>;
  performedBy?: number;
  performedByName?: string;
}) {
  const db = getDb();
  const result = await db.insert(activityLog).values({
    responseId: data.responseId,
    formId: data.formId,
    activityType: data.activityType,
    description: data.description || null,
    metadata: data.metadata || null,
    performedBy: data.performedBy || null,
    performedByName: data.performedByName || null,
  });
  return (result as any)[0]?.insertId;
}

/**
 * Get all activity events for a response (for timeline display).
 * Returns newest first.
 */
export async function getActivityTimeline(responseId: number) {
  const db = getDb();
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.responseId, responseId))
    .orderBy(desc(activityLog.createdAt));
}

/**
 * Get activity events for multiple responses (batch query for card list).
 */
export async function getActivityTimelineByForm(formId: number) {
  const db = getDb();
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.formId, formId))
    .orderBy(desc(activityLog.createdAt));
}


/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSION STATS — Funnel metrics for form responses
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get conversion funnel stats for a form over a given period.
 * Returns: total started, completed, approved, rejected, pending, and daily breakdown.
 */
export async function getConversionStats(formId: number, period: string = "30d") {
  const db = getDb();

  // Calculate date cutoff
  let dateCutoff: Date | null = null;
  const now = new Date();
  if (period === "7d") {
    dateCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    dateCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "90d") {
    dateCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  // "all" → no date filter

  const conditions = [eq(formResponses.formId, formId)];
  if (dateCutoff) {
    conditions.push(gte(formResponses.createdAt, dateCutoff));
  }

  const allResponses = await db
    .select({
      id: formResponses.id,
      isComplete: formResponses.isComplete,
      validationStatus: formResponses.validationStatus,
      createdAt: formResponses.createdAt,
    })
    .from(formResponses)
    .where(and(...conditions))
    .orderBy(formResponses.createdAt);

  const total = allResponses.length;
  type ResponseRow = typeof allResponses[number];
  const complete = allResponses.filter((r: ResponseRow) => r.isComplete).length;
  const incomplete = total - complete;
  const approved = allResponses.filter((r: ResponseRow) => r.validationStatus === "approved").length;
  const rejected = allResponses.filter((r: ResponseRow) => r.validationStatus === "rejected").length;
  const inReview = allResponses.filter((r: ResponseRow) => r.validationStatus === "in_review").length;
  const pending = allResponses.filter((r: ResponseRow) => r.validationStatus === "pending").length;

  // Daily breakdown for chart
  const dailyMap: Record<string, { started: number; completed: number; approved: number }> = {};

  // Determine the number of days to show
  const daysToShow = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { started: 0, completed: 0, approved: 0 };
  }

  allResponses.forEach((r: ResponseRow) => {
    const key = r.createdAt.toISOString().split("T")[0];
    if (dailyMap[key]) {
      dailyMap[key].started++;
      if (r.isComplete) dailyMap[key].completed++;
      if (r.validationStatus === "approved") dailyMap[key].approved++;
    }
  });

  const daily = Object.entries(dailyMap).map(([date, counts]) => ({
    date,
    label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    ...counts,
  }));

  // Conversion rates
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;
  const approvalRate = complete > 0 ? Math.round((approved / complete) * 100) : 0;

  return {
    total,
    complete,
    incomplete,
    approved,
    rejected,
    inReview,
    pending,
    completionRate,
    approvalRate,
    daily,
  };
}


/* ═══════════════════════════════════════════════════════════════════════════
   CADENCE MANAGEMENT — Global cadence listing and batch operations
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get all cadences with filters, pagination, and joined form/response info.
 */
export async function getAllCadences(params: {
  status?: "active" | "paused" | "stopped";
  cadenceType?: "abandono" | "reprovacao";
  formId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  cadences: Array<{
    id: number;
    responseId: number;
    formId: number;
    formTitle: string;
    cadenceType: "abandono" | "reprovacao";
    recipientEmail: string;
    recipientName: string | null;
    rejectionReason: string | null;
    sequenceNumber: number;
    maxSequence: number;
    nextSendAt: Date | null;
    lastSentAt: Date | null;
    active: boolean;
    stoppedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    protocol: string | null;
  }>;
  total: number;
  stats: {
    active: number;
    paused: number;
    stopped: number;
    total: number;
    abandonoActive: number;
    reprovacaoActive: number;
  };
}> {
  const db = getDb();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  // Build conditions
  const conditions: any[] = [];

  if (params.status === "active") {
    conditions.push(eq(emailCadence.active, true));
    conditions.push(isNotNull(emailCadence.nextSendAt));
  } else if (params.status === "paused") {
    conditions.push(eq(emailCadence.active, true));
    conditions.push(isNull(emailCadence.nextSendAt));
  } else if (params.status === "stopped") {
    conditions.push(eq(emailCadence.active, false));
  }

  if (params.cadenceType) {
    conditions.push(eq(emailCadence.cadenceType, params.cadenceType));
  }

  if (params.formId) {
    conditions.push(eq(emailCadence.formId, params.formId));
  }

  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(emailCadence.recipientEmail, searchTerm),
        like(emailCadence.recipientName, searchTerm),
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get cadences with form title
  const cadences = await db
    .select({
      id: emailCadence.id,
      responseId: emailCadence.responseId,
      formId: emailCadence.formId,
      formTitle: forms.title,
      cadenceType: emailCadence.cadenceType,
      recipientEmail: emailCadence.recipientEmail,
      recipientName: emailCadence.recipientName,
      rejectionReason: emailCadence.rejectionReason,
      sequenceNumber: emailCadence.sequenceNumber,
      maxSequence: emailCadence.maxSequence,
      nextSendAt: emailCadence.nextSendAt,
      lastSentAt: emailCadence.lastSentAt,
      active: emailCadence.active,
      stoppedReason: emailCadence.stoppedReason,
      createdAt: emailCadence.createdAt,
      updatedAt: emailCadence.updatedAt,
      protocol: formResponses.protocolCode,
    })
    .from(emailCadence)
    .leftJoin(forms, eq(emailCadence.formId, forms.id))
    .leftJoin(formResponses, eq(emailCadence.responseId, formResponses.id))
    .where(whereClause)
    .orderBy(desc(emailCadence.updatedAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(emailCadence)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Get stats (always unfiltered for overview)
  const statsResult = await db
    .select({
      active: emailCadence.active,
      nextSendAt: emailCadence.nextSendAt,
      cadenceType: emailCadence.cadenceType,
      count: sql<number>`COUNT(*)`,
    })
    .from(emailCadence)
    .groupBy(emailCadence.active, emailCadence.nextSendAt, emailCadence.cadenceType);

  let activeCount = 0;
  let pausedCount = 0;
  let stoppedCount = 0;
  let abandonoActive = 0;
  let reprovacaoActive = 0;

  statsResult.forEach((row: any) => {
    if (!row.active) {
      stoppedCount += row.count;
    } else if (row.nextSendAt === null) {
      pausedCount += row.count;
    } else {
      activeCount += row.count;
      if (row.cadenceType === "abandono") abandonoActive += row.count;
      if (row.cadenceType === "reprovacao") reprovacaoActive += row.count;
    }
  });

  return {
    cadences,
    total,
    stats: {
      active: activeCount,
      paused: pausedCount,
      stopped: stoppedCount,
      total: activeCount + pausedCount + stoppedCount,
      abandonoActive,
      reprovacaoActive,
    },
  };
}

/**
 * Pause a cadence (set nextSendAt to null but keep active).
 */
export async function pauseCadence(cadenceId: number): Promise<void> {
  const db = getDb();
  await db
    .update(emailCadence)
    .set({ nextSendAt: null })
    .where(eq(emailCadence.id, cadenceId));
}

/**
 * Resume a paused cadence (set nextSendAt to next Mon/Wed/Fri at 9am BRT).
 */
export async function resumeCadence(cadenceId: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  // Find next Mon(1), Wed(3), or Fri(5) at 12:00 UTC (9am BRT)
  const dayOfWeek = now.getUTCDay();
  const sendDays = [1, 3, 5]; // Mon, Wed, Fri
  let daysUntilNext = 1;
  for (let i = 1; i <= 7; i++) {
    const targetDay = (dayOfWeek + i) % 7;
    if (sendDays.includes(targetDay)) {
      daysUntilNext = i;
      break;
    }
  }
  const nextSend = new Date(now);
  nextSend.setUTCDate(nextSend.getUTCDate() + daysUntilNext);
  nextSend.setUTCHours(12, 0, 0, 0); // 9am BRT

  await db
    .update(emailCadence)
    .set({ nextSendAt: nextSend })
    .where(eq(emailCadence.id, cadenceId));
}

/**
 * Batch pause multiple cadences.
 */
export async function batchPauseCadences(cadenceIds: number[]): Promise<number> {
  if (cadenceIds.length === 0) return 0;
  const db = getDb();
  const result = await db
    .update(emailCadence)
    .set({ nextSendAt: null })
    .where(and(inArray(emailCadence.id, cadenceIds), eq(emailCadence.active, true)));
  return cadenceIds.length;
}

/**
 * Batch stop multiple cadences.
 */
export async function batchStopCadences(cadenceIds: number[]): Promise<number> {
  if (cadenceIds.length === 0) return 0;
  const db = getDb();
  await db
    .update(emailCadence)
    .set({ active: false, stoppedReason: "manual", nextSendAt: null })
    .where(inArray(emailCadence.id, cadenceIds));
  return cadenceIds.length;
}

/**
 * Get all distinct forms that have cadences (for filter dropdown).
 */
export async function getFormsWithCadences(): Promise<Array<{ id: number; title: string }>> {
  const db = getDb();
  const results = await db
    .selectDistinct({
      id: forms.id,
      title: forms.title,
    })
    .from(emailCadence)
    .innerJoin(forms, eq(emailCadence.formId, forms.id))
    .orderBy(forms.title);
  return results;
}


/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSE FOLDERS — Corretores can organize responses into folders
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Create a new response folder for a staff user.
 */
export async function createResponseFolder(data: InsertResponseFolder) {
  return withDbRetry(async (db) => {
    const result = await db.insert(responseFolders).values(data);
    return { id: result[0].insertId };
  });
}

/**
 * Get all folders for a staff user.
 */
export async function getResponseFoldersByStaff(staffUserId: number) {
  return withDbRetry(async (db) => {
    return db
      .select()
      .from(responseFolders)
      .where(eq(responseFolders.staffUserId, staffUserId))
      .orderBy(responseFolders.sortOrder, responseFolders.name);
  });
}

/**
 * Update a response folder (name, color, sortOrder).
 */
export async function updateResponseFolder(
  folderId: number,
  staffUserId: number,
  data: Partial<Pick<InsertResponseFolder, "name" | "color" | "sortOrder">>
) {
  return withDbRetry(async (db) => {
    await db
      .update(responseFolders)
      .set(data)
      .where(and(eq(responseFolders.id, folderId), eq(responseFolders.staffUserId, staffUserId)));
  });
}

/**
 * Delete a response folder and all its assignments.
 */
export async function deleteResponseFolder(folderId: number, staffUserId: number) {
  return withDbRetry(async (db) => {
    // Remove all assignments first
    await db
      .delete(responseFolderAssignments)
      .where(and(eq(responseFolderAssignments.folderId, folderId), eq(responseFolderAssignments.staffUserId, staffUserId)));
    // Delete the folder
    await db
      .delete(responseFolders)
      .where(and(eq(responseFolders.id, folderId), eq(responseFolders.staffUserId, staffUserId)));
  });
}

/**
 * Assign a response to a folder. Removes any existing assignment for this response+staff first.
 */
export async function assignResponseToFolder(responseId: number, folderId: number, staffUserId: number) {
  return withDbRetry(async (db) => {
    // Remove existing assignment for this response by this staff user
    await db
      .delete(responseFolderAssignments)
      .where(
        and(
          eq(responseFolderAssignments.responseId, responseId),
          eq(responseFolderAssignments.staffUserId, staffUserId)
        )
      );
    // Create new assignment
    await db.insert(responseFolderAssignments).values({
      responseId,
      folderId,
      staffUserId,
    });
  });
}

/**
 * Remove a response from any folder (unassign).
 */
export async function removeResponseFromFolder(responseId: number, staffUserId: number) {
  return withDbRetry(async (db) => {
    await db
      .delete(responseFolderAssignments)
      .where(
        and(
          eq(responseFolderAssignments.responseId, responseId),
          eq(responseFolderAssignments.staffUserId, staffUserId)
        )
      );
  });
}

/**
 * Get all folder assignments for a staff user (to map responses to folders).
 */
export async function getFolderAssignmentsByStaff(staffUserId: number) {
  return withDbRetry(async (db) => {
    return db
      .select({
        responseId: responseFolderAssignments.responseId,
        folderId: responseFolderAssignments.folderId,
      })
      .from(responseFolderAssignments)
      .where(eq(responseFolderAssignments.staffUserId, staffUserId));
  });
}

/**
 * Batch assign multiple responses to a folder.
 */
export async function batchAssignResponsesToFolder(
  responseIds: number[],
  folderId: number,
  staffUserId: number
) {
  if (responseIds.length === 0) return;
  return withDbRetry(async (db) => {
    // Remove existing assignments for these responses
    await db
      .delete(responseFolderAssignments)
      .where(
        and(
          inArray(responseFolderAssignments.responseId, responseIds),
          eq(responseFolderAssignments.staffUserId, staffUserId)
        )
      );
    // Create new assignments
    const values = responseIds.map((responseId) => ({
      responseId,
      folderId,
      staffUserId,
    }));
    await db.insert(responseFolderAssignments).values(values);
  });
}

/**
 * Get folder assignment counts (how many responses per folder).
 */
export async function getFolderCounts(staffUserId: number): Promise<Record<number, number>> {
  return withDbRetry(async (db) => {
    const results = await db
      .select({
        folderId: responseFolderAssignments.folderId,
        count: sql<number>`COUNT(*)`,
      })
      .from(responseFolderAssignments)
      .where(eq(responseFolderAssignments.staffUserId, staffUserId))
      .groupBy(responseFolderAssignments.folderId);
    
    const counts: Record<number, number> = {};
    results.forEach((r: any) => {
      counts[r.folderId] = r.count;
    });
    return counts;
  });
}

/* ─── Corretor Performance Metrics ─── */

/**
 * Get performance metrics for a specific corretor (staff user).
 * Returns: total responses assigned, validated count, approved count, rejected count,
 * average validation time (from response creation to reviewedAt).
 */
export async function getCorretorPerformance(staffUserId: number) {
  return withDbRetry(async (db) => {
    // Get all forms assigned to this corretor
    const assignedForms = await db.select({ id: forms.id })
      .from(forms)
      .where(eq(forms.assignedCorretorId, staffUserId));

    if (assignedForms.length === 0) {
      return {
        totalResponses: 0,
        completedResponses: 0,
        approvedResponses: 0,
        rejectedResponses: 0,
        pendingResponses: 0,
        inReviewResponses: 0,
        approvalRate: 0,
        rejectionRate: 0,
        avgValidationTimeMs: 0,
        formCount: 0,
      };
    }

    const formIds = assignedForms.map((f: any) => f.id);

    // Get all responses for these forms
    const allResponses = await db.select({
      id: formResponses.id,
      validationStatus: formResponses.validationStatus,
      isComplete: formResponses.isComplete,
      createdAt: formResponses.createdAt,
      reviewedAt: formResponses.reviewedAt,
    })
      .from(formResponses)
      .where(
        and(
          inArray(formResponses.formId, formIds),
          eq(formResponses.isComplete, true)
        )
      );

    const total = allResponses.length;
    const approved = allResponses.filter((r: any) => r.validationStatus === "approved").length;
    const rejected = allResponses.filter((r: any) => r.validationStatus === "rejected").length;
    const pending = allResponses.filter((r: any) => r.validationStatus === "pending").length;
    const inReview = allResponses.filter((r: any) => r.validationStatus === "in_review").length;
    const completed = approved + rejected;

    // Calculate average validation time for completed validations
    let totalTimeMs = 0;
    let timeCount = 0;
    for (const r of allResponses) {
      if (r.reviewedAt && r.createdAt) {
        const diff = new Date(r.reviewedAt).getTime() - new Date(r.createdAt).getTime();
        if (diff > 0) {
          totalTimeMs += diff;
          timeCount++;
        }
      }
    }

    return {
      totalResponses: total,
      completedResponses: completed,
      approvedResponses: approved,
      rejectedResponses: rejected,
      pendingResponses: pending,
      inReviewResponses: inReview,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
      avgValidationTimeMs: timeCount > 0 ? Math.round(totalTimeMs / timeCount) : 0,
      formCount: formIds.length,
    };
  });
}

/**
 * Get performance metrics for ALL corretores (for admin dashboard).
 */
export async function getAllCorretoresPerformance() {
  return withDbRetry(async (db) => {
    // Get all staff users with role 'corretor'
    const allCorretores = await db.select({
      id: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
      active: staffUsers.active,
    })
      .from(staffUsers)
      .where(eq(staffUsers.role, "corretor"));

    const results = [];

    for (const corretor of allCorretores) {
      const metrics = await getCorretorPerformance(corretor.id);
      results.push({
        ...corretor,
        ...metrics,
      });
    }

    return results;
  });
}

/**
 * Get performance metrics grouped by gerente (for admin dashboard).
 * Each gerente shows aggregated metrics from their corretores.
 */
export async function getPerformanceByManager() {
  return withDbRetry(async (db) => {
    // Get all gerentes
    const allGerentes = await db.select({
      id: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
      active: staffUsers.active,
    })
      .from(staffUsers)
      .where(eq(staffUsers.role, "gerente"));

    const results = [];

    for (const gerente of allGerentes) {
      // Get corretores assigned to this gerente (managerId or invitedBy)
      const myCorretores = await db.select({
        id: staffUsers.id,
        name: staffUsers.name,
        managerId: staffUsers.managerId,
      })
        .from(staffUsers)
        .where(and(
          or(eq(staffUsers.managerId, gerente.id), eq(staffUsers.invitedBy, gerente.id)),
          eq(staffUsers.role, "corretor")
        ));

      // Aggregate metrics from all corretores
      let totalResponses = 0;
      let completedResponses = 0;
      let approvedResponses = 0;
      let rejectedResponses = 0;
      let pendingResponses = 0;
      let inReviewResponses = 0;
      let totalTimeMs = 0;
      let timeCount = 0;
      let formCount = 0;

      const corretorDetails = [];

      for (const corretor of myCorretores) {
        const metrics = await getCorretorPerformance(corretor.id);
        totalResponses += metrics.totalResponses;
        completedResponses += metrics.completedResponses;
        approvedResponses += metrics.approvedResponses;
        rejectedResponses += metrics.rejectedResponses;
        pendingResponses += metrics.pendingResponses;
        inReviewResponses += metrics.inReviewResponses;
        formCount += metrics.formCount;
        if (metrics.avgValidationTimeMs > 0) {
          totalTimeMs += metrics.avgValidationTimeMs;
          timeCount++;
        }
        corretorDetails.push({
          id: corretor.id,
          name: corretor.name,
          ...metrics,
        });
      }

      results.push({
        id: gerente.id,
        name: gerente.name,
        email: gerente.email,
        active: gerente.active,
        corretorCount: myCorretores.length,
        totalResponses,
        completedResponses,
        approvedResponses,
        rejectedResponses,
        pendingResponses,
        inReviewResponses,
        approvalRate: totalResponses > 0 ? Math.round((approvedResponses / totalResponses) * 100) : 0,
        rejectionRate: totalResponses > 0 ? Math.round((rejectedResponses / totalResponses) * 100) : 0,
        avgValidationTimeMs: timeCount > 0 ? Math.round(totalTimeMs / timeCount) : 0,
        formCount,
        corretores: corretorDetails,
      });
    }

    return results;
  });
}

/**
 * Get child forms count for a parent form (for sync indicator).
 */
export async function getChildFormsCount(parentFormId: number): Promise<number> {
  return withDbRetry(async (db) => {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(forms)
      .where(eq(forms.parentFormId, parentFormId));
    return result[0]?.count ?? 0;
  });
}

/**
 * Get all child forms with their corretor info (for management panel).
 */
export async function getChildFormsWithCorretores(parentFormId: number) {
  return withDbRetry(async (db) => {
    const children = await db.select({
      id: forms.id,
      title: forms.title,
      slug: forms.slug,
      status: forms.status,
      responseCount: forms.responseCount,
      assignedCorretorId: forms.assignedCorretorId,
      updatedAt: forms.updatedAt,
      createdAt: forms.createdAt,
    })
      .from(forms)
      .where(eq(forms.parentFormId, parentFormId))
      .orderBy(desc(forms.createdAt));

    // Enrich with corretor names
    const enriched = [];
    for (const child of children) {
      let corretorName = "Não atribuído";
      if (child.assignedCorretorId) {
        const staff = await db.select({ name: staffUsers.name })
          .from(staffUsers)
          .where(eq(staffUsers.id, child.assignedCorretorId))
          .limit(1);
        if (staff[0]) corretorName = staff[0].name;
      }
      enriched.push({ ...child, corretorName });
    }

    return enriched;
  });
}

/* ─── Inactive Corretor Detection ─── */

/**
 * Get corretores who have been inactive (no validations) for the specified number of days.
 * Returns corretores with their last validation date and assigned form info.
 */
export async function getInactiveCorretores(inactiveDays: number = 7): Promise<Array<{
  id: number;
  name: string;
  email: string;
  lastValidationAt: Date | null;
  daysSinceLastValidation: number | null;
  assignedFormCount: number;
}>> {
  const db = getDb();
  {
    // Get all active corretores
    const activeCorretores = await db.select({
      id: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
    })
      .from(staffUsers)
      .where(and(
        eq(staffUsers.role, "corretor" as any),
        eq(staffUsers.active, true),
      ));

    if (activeCorretores.length === 0) return [];

    const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    const inactiveList: Array<{
      id: number;
      name: string;
      email: string;
      lastValidationAt: Date | null;
      daysSinceLastValidation: number | null;
      assignedFormCount: number;
    }> = [];

    for (const corretor of activeCorretores) {
      // Get last validation by this corretor
      const lastValidation = await db.select({
        validatedAt: responseValidations.validatedAt,
      })
        .from(responseValidations)
        .where(eq(responseValidations.validatedBy, corretor.id))
        .orderBy(desc(responseValidations.validatedAt))
        .limit(1);

      const lastValidationAt = lastValidation[0]?.validatedAt || null;

      // Check if inactive: either never validated, or last validation was before cutoff
      const isInactive = !lastValidationAt || lastValidationAt < cutoffDate;

      if (isInactive) {
        // Count assigned forms
        const assignedForms = await db.select({ id: forms.id })
          .from(forms)
          .where(eq(forms.assignedCorretorId, corretor.id));

        const daysSince = lastValidationAt
          ? Math.floor((Date.now() - lastValidationAt.getTime()) / (24 * 60 * 60 * 1000))
          : null;

        inactiveList.push({
          id: corretor.id,
          name: corretor.name,
          email: corretor.email,
          lastValidationAt,
          daysSinceLastValidation: daysSince,
          assignedFormCount: assignedForms.length,
        });
      }
    }

    return inactiveList;
  }
}

/* ─── Weekly Statistics for Admin Summary Email ─── */

export interface WeeklyStats {
  period: { start: Date; end: Date };
  responses: {
    total: number;
    newThisWeek: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  validation: {
    totalValidated: number;
    approvalRate: number;
    rejectionRate: number;
  };
  corretores: Array<{
    id: number;
    name: string;
    email: string;
    validationsCount: number;
    approvedCount: number;
    rejectedCount: number;
  }>;
  forms: {
    totalForms: number;
    totalPublished: number;
  };
}

/**
 * Collect weekly statistics for the admin summary email.
 * Covers the last 7 days from the given date.
 */
export async function getWeeklyStats(asOfDate: Date = new Date()): Promise<WeeklyStats> {
  const db = getDb();

  const weekEnd = asOfDate;
  const weekStart = new Date(asOfDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total responses
  const allResponses = await db.select({ id: formResponses.id, validationStatus: formResponses.validationStatus, createdAt: formResponses.createdAt })
    .from(formResponses);

  const newThisWeek = allResponses.filter((r: any) => r.createdAt && r.createdAt >= weekStart && r.createdAt <= weekEnd).length;
  const approved = allResponses.filter((r: any) => r.validationStatus === "approved").length;
  const rejected = allResponses.filter((r: any) => r.validationStatus === "rejected").length;
  const pending = allResponses.filter((r: any) => r.validationStatus === "pending" || r.validationStatus === "in_review").length;

  // Validations this week
  const weekValidations = await db.select({
    id: responseValidations.id,
    status: responseValidations.status,
    validatedBy: responseValidations.validatedBy,
    validatedAt: responseValidations.validatedAt,
  })
    .from(responseValidations)
    .where(and(
      gte(responseValidations.validatedAt, weekStart),
      lte(responseValidations.validatedAt, weekEnd),
    ));

  const totalValidated = weekValidations.length;
  const weekApproved = weekValidations.filter((v: any) => v.status === "approved").length;
  const weekRejected = weekValidations.filter((v: any) => v.status === "rejected").length;
  const approvalRate = totalValidated > 0 ? Math.round((weekApproved / totalValidated) * 100) : 0;
  const rejectionRate = totalValidated > 0 ? Math.round((weekRejected / totalValidated) * 100) : 0;

  // Corretores performance this week
  const activeCorretores = await db.select({
    id: staffUsers.id,
    name: staffUsers.name,
    email: staffUsers.email,
  })
    .from(staffUsers)
    .where(and(
      eq(staffUsers.role, "corretor" as any),
      eq(staffUsers.active, true),
    ));

  const corretoresStats: WeeklyStats["corretores"] = [];
  for (const corretor of activeCorretores) {
    const corretorValidations = weekValidations.filter((v: any) => v.validatedBy === corretor.id);
    const corretorApproved = corretorValidations.filter((v: any) => v.status === "approved").length;
    const corretorRejected = corretorValidations.filter((v: any) => v.status === "rejected").length;

    corretoresStats.push({
      id: corretor.id,
      name: corretor.name,
      email: corretor.email,
      validationsCount: corretorValidations.length,
      approvedCount: corretorApproved,
      rejectedCount: corretorRejected,
    });
  }

  // Sort by validations count (most active first)
  corretoresStats.sort((a, b) => b.validationsCount - a.validationsCount);

  // Forms stats
  const allForms = await db.select({ id: forms.id, status: forms.status })
    .from(forms);
  const totalForms = allForms.length;
  const totalPublished = allForms.filter((f: any) => f.status === "published").length;

  return {
    period: { start: weekStart, end: weekEnd },
    responses: {
      total: allResponses.length,
      newThisWeek,
      approved,
      rejected,
      pending,
    },
    validation: {
      totalValidated,
      approvalRate,
      rejectionRate,
    },
    corretores: corretoresStats,
    forms: {
      totalForms,
      totalPublished,
    },
  };
}


/**
 * Get unread response counts for all forms belonging to a user.
 * Returns a lightweight summary: { totalUnread, forms: [{ formId, title, unread }] }
 * Used for real-time badge polling without loading full form data.
 */
export async function getUnreadResponseCounts(userId: number) {
  return withDbRetry(async (db) => {
    const result = await db
      .select({
        id: forms.id,
        title: forms.title,
        responseCount: forms.responseCount,
        lastSeenResponseCount: forms.lastSeenResponseCount,
      })
      .from(forms)
      .where(eq(forms.userId, userId));

    let totalUnread = 0;
    const formCounts = result
      .map((f: any) => {
        const unread = Math.max(0, f.responseCount - f.lastSeenResponseCount);
        totalUnread += unread;
        return { formId: f.id, title: f.title, unread };
      })
      .filter((f: any) => f.unread > 0);

    return { totalUnread, forms: formCounts };
  });
}

/**
 * Get unread response count for a specific corretor (staff user).
 * Counts responses assigned to their forms that they haven't seen.
 */
export async function getCorretorUnreadCount(staffUserId: number) {
  return withDbRetry(async (db) => {
    // Get forms assigned to this corretor
    const assignedForms = await db
      .select({
        id: forms.id,
        title: forms.title,
        responseCount: forms.responseCount,
        lastSeenResponseCount: forms.lastSeenResponseCount,
      })
      .from(forms)
      .where(eq(forms.assignedCorretorId, staffUserId));

    let totalUnread = 0;
    const formCounts = assignedForms
      .map((f: any) => {
        const unread = Math.max(0, f.responseCount - f.lastSeenResponseCount);
        totalUnread += unread;
        return { formId: f.id, title: f.title, unread };
      })
      .filter((f: any) => f.unread > 0);

    return { totalUnread, forms: formCounts };
  });
}


// ─── Form Assignments ────────────────────────────────────────────
import { formAssignments } from "../drizzle/schema";

/**
 * Get all staff assigned to a specific form
 */
export async function getFormAssignments(formId: number) {
  return withDbRetry(async (db) => {
    const rows = await db
      .select()
      .from(formAssignments)
      .where(eq(formAssignments.formId, formId));
    return rows;
  });
}

/**
 * Get all form IDs assigned to a specific staff user
 */
export async function getFormIdsByStaff(staffUserId: number): Promise<number[]> {
  return withDbRetry(async (db) => {
    const rows = await db
      .select({ formId: formAssignments.formId })
      .from(formAssignments)
      .where(eq(formAssignments.staffUserId, staffUserId));
    return rows.map((r: any) => r.formId);
  });
}

/**
 * Assign a staff user to a form
 */
export async function assignStaffToForm(formId: number, staffUserId: number, assignedBy?: number) {
  return withDbRetry(async (db) => {
    // Check if already assigned
    const existing = await db
      .select()
      .from(formAssignments)
      .where(and(
        eq(formAssignments.formId, formId),
        eq(formAssignments.staffUserId, staffUserId)
      ));
    if (existing.length > 0) return existing[0];
    
    const [result] = await db.insert(formAssignments).values({
      formId,
      staffUserId,
      assignedBy: assignedBy ?? null,
    });
    return { id: result.insertId, formId, staffUserId };
  });
}

/**
 * Remove a staff user from a form
 */
export async function removeStaffFromForm(formId: number, staffUserId: number) {
  return withDbRetry(async (db) => {
    await db
      .delete(formAssignments)
      .where(and(
        eq(formAssignments.formId, formId),
        eq(formAssignments.staffUserId, staffUserId)
      ));
  });
}

/**
 * Set the full list of assigned staff for a form (replaces existing)
 */
export async function setFormAssignments(formId: number, staffUserIds: number[], assignedBy?: number) {
  return withDbRetry(async (db) => {
    // Remove all existing assignments
    await db.delete(formAssignments).where(eq(formAssignments.formId, formId));
    // Insert new assignments
    if (staffUserIds.length > 0) {
      await db.insert(formAssignments).values(
        staffUserIds.map(staffUserId => ({
          formId,
          staffUserId,
          assignedBy: assignedBy ?? null,
        }))
      );
    }
  });
}

/**
 * Get assignments for multiple forms at once (for dashboard display)
 */
export async function getFormAssignmentsBatch(formIds: number[]) {
  if (formIds.length === 0) return {};
  return withDbRetry(async (db) => {
    const rows = await db
      .select()
      .from(formAssignments)
      .where(inArray(formAssignments.formId, formIds));
    
    const result: Record<number, number[]> = {};
    for (const row of rows) {
      if (!result[row.formId]) result[row.formId] = [];
      result[row.formId].push(row.staffUserId);
    }
    return result;
  });
}


/* ─── Staff Notifications ─── */

/**
 * Create a staff notification
 */
export async function createStaffNotification(data: {
  staffUserId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  return withDbRetry(async (db) => {
    const [result] = await db.insert(staffNotifications).values({
      staffUserId: data.staffUserId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
      metadata: data.metadata ?? null,
    });
    return result.insertId;
  });
}

/**
 * Create notifications in batch for multiple staff users
 */
export async function createStaffNotificationsBatch(notifications: Array<{
  staffUserId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
}>) {
  if (notifications.length === 0) return;
  return withDbRetry(async (db) => {
    await db.insert(staffNotifications).values(
      notifications.map((n) => ({
        staffUserId: n.staffUserId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        link: n.link ?? null,
        metadata: n.metadata ?? null,
      }))
    );
  });
}

/**
 * Get notifications for a staff user (paginated, newest first)
 */
export async function getStaffNotifications(staffUserId: number, limit = 50, offset = 0) {
  return withDbRetry(async (db) => {
    return db
      .select()
      .from(staffNotifications)
      .where(eq(staffNotifications.staffUserId, staffUserId))
      .orderBy(desc(staffNotifications.createdAt))
      .limit(limit)
      .offset(offset);
  });
}

/**
 * Count unread notifications for a staff user
 */
export async function countUnreadStaffNotifications(staffUserId: number): Promise<number> {
  return withDbRetry(async (db) => {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(staffNotifications)
      .where(
        and(
          eq(staffNotifications.staffUserId, staffUserId),
          eq(staffNotifications.isRead, false)
        )
      );
    return rows[0]?.count ?? 0;
  });
}

/**
 * Mark a notification as read
 */
export async function markStaffNotificationRead(id: number, staffUserId: number) {
  return withDbRetry(async (db) => {
    await db
      .update(staffNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(staffNotifications.id, id),
          eq(staffNotifications.staffUserId, staffUserId)
        )
      );
  });
}

/**
 * Mark all notifications as read for a staff user
 */
export async function markAllStaffNotificationsRead(staffUserId: number) {
  return withDbRetry(async (db) => {
    await db
      .update(staffNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(staffNotifications.staffUserId, staffUserId),
          eq(staffNotifications.isRead, false)
        )
      );
  });
}

/**
 * Get incomplete responses that have been inactive for more than `timeoutMinutes`.
 * Only returns responses that haven't already been notified about abandonment.
 */
export async function getAbandonedResponses(timeoutMinutes: number = 8): Promise<{
  id: number;
  formId: number;
  respondentName: string | null;
  respondentEmail: string | null;
  answers: Record<string, any>;
  protocolCode: string | null;
  formTitle: string;
  lastActivityAt: Date | null;
  createdAt: Date;
}[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const results = await db
    .select({
      id: formResponses.id,
      formId: formResponses.formId,
      respondentName: formResponses.respondentName,
      respondentEmail: formResponses.respondentEmail,
      answers: formResponses.answers,
      protocolCode: formResponses.protocolCode,
      formTitle: forms.title,
      lastActivityAt: formResponses.lastActivityAt,
      createdAt: formResponses.createdAt,
    })
    .from(formResponses)
    .innerJoin(forms, eq(formResponses.formId, forms.id))
    .where(
      and(
        eq(formResponses.isComplete, false),
        isNull(formResponses.abandonmentNotifiedAt),
        lte(formResponses.lastActivityAt, cutoff),
        eq(forms.status, "published"),
      )
    )
    .limit(50);

  return results;
}

/**
 * Mark a response as having sent the abandonment notification.
 */
export async function markAbandonmentNotified(responseId: number): Promise<void> {
  const db = getDb();
  await db
    .update(formResponses)
    .set({ abandonmentNotifiedAt: new Date() })
    .where(eq(formResponses.id, responseId));
}

/* ─── Staff Notification Preferences ─── */

/** Default notification types with their labels */
export const NOTIFICATION_TYPES = [
  { key: "response_started", label: "Cliente começou a cadastrar", description: "Quando um cliente inicia o preenchimento de um formulário" },
  { key: "new_response", label: "Cliente finalizou o cadastro", description: "Quando um cliente conclui e envia o formulário" },
  { key: "response_abandoned", label: "Cliente abandonou o cadastro", description: "Quando um cliente para de preencher por 10 minutos" },
  { key: "response_approved", label: "Cadastro aprovado", description: "Quando um cadastro é aprovado" },
  { key: "response_rejected", label: "Cadastro rejeitado", description: "Quando um cadastro é rejeitado" },
] as const;

export type NotificationTypeKey = typeof NOTIFICATION_TYPES[number]["key"];

/**
 * Get all notification preferences for a staff user.
 * Returns defaults (all enabled) for types that don't have a row yet.
 */
export async function getStaffNotificationPreferences(staffUserId: number) {
  return withDbRetry(async (db) => {
    const rows = await db
      .select()
      .from(staffNotificationPreferences)
      .where(eq(staffNotificationPreferences.staffUserId, staffUserId));

    // Build a map of existing preferences
    const prefsMap = new Map(rows.map((r: any) => [r.notificationType, r]));

    // Return all types with defaults for missing ones
    return NOTIFICATION_TYPES.map((t) => {
      const existing = prefsMap.get(t.key);
      return {
        notificationType: t.key,
        label: t.label,
        description: t.description,
        inAppEnabled: existing ? (existing as any).inAppEnabled : true,
        pushEnabled: existing ? (existing as any).pushEnabled : true,
      };
    });
  });
}

/**
 * Update a single notification preference for a staff user.
 * Creates the row if it doesn't exist (upsert).
 */
export async function upsertStaffNotificationPreference(
  staffUserId: number,
  notificationType: string,
  inAppEnabled: boolean,
  pushEnabled: boolean,
) {
  return withDbRetry(async (db) => {
    // Check if row exists
    const existing = await db
      .select()
      .from(staffNotificationPreferences)
      .where(
        and(
          eq(staffNotificationPreferences.staffUserId, staffUserId),
          eq(staffNotificationPreferences.notificationType, notificationType),
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(staffNotificationPreferences)
        .set({ inAppEnabled, pushEnabled })
        .where(
          and(
            eq(staffNotificationPreferences.staffUserId, staffUserId),
            eq(staffNotificationPreferences.notificationType, notificationType),
          )
        );
    } else {
      await db.insert(staffNotificationPreferences).values({
        staffUserId,
        notificationType,
        inAppEnabled,
        pushEnabled,
      });
    }
  });
}

/**
 * Check if a specific notification type is enabled for a staff user.
 * Returns { inApp: boolean, push: boolean }.
 * Defaults to both enabled if no preference row exists.
 */
export async function isNotificationEnabled(
  staffUserId: number,
  notificationType: string,
): Promise<{ inApp: boolean; push: boolean }> {
  return withDbRetry(async (db) => {
    const rows = await db
      .select()
      .from(staffNotificationPreferences)
      .where(
        and(
          eq(staffNotificationPreferences.staffUserId, staffUserId),
          eq(staffNotificationPreferences.notificationType, notificationType),
        )
      )
      .limit(1);

    if (rows.length === 0) {
      // No preference set = both enabled by default
      return { inApp: true, push: true };
    }

    return {
      inApp: (rows[0] as any).inAppEnabled,
      push: (rows[0] as any).pushEnabled,
    };
  });
}

/**
 * Batch check notification preferences for multiple staff users and a single type.
 * Returns a Map<staffUserId, { inApp: boolean, push: boolean }>.
 * Users without preferences default to both enabled.
 */
export async function getNotificationPreferencesForStaff(
  staffUserIds: number[],
  notificationType: string,
): Promise<Map<number, { inApp: boolean; push: boolean }>> {
  if (staffUserIds.length === 0) return new Map();

  return withDbRetry(async (db) => {
    const rows = await db
      .select()
      .from(staffNotificationPreferences)
      .where(
        and(
          inArray(staffNotificationPreferences.staffUserId, staffUserIds),
          eq(staffNotificationPreferences.notificationType, notificationType),
        )
      );

    const prefsMap = new Map<number, { inApp: boolean; push: boolean }>();
    for (const row of rows) {
      prefsMap.set((row as any).staffUserId, {
        inApp: (row as any).inAppEnabled,
        push: (row as any).pushEnabled,
      });
    }

    // Fill defaults for users without preferences
    for (const id of staffUserIds) {
      if (!prefsMap.has(id)) {
        prefsMap.set(id, { inApp: true, push: true });
      }
    }

    return prefsMap;
  });
}


/* ─── Integration Logs ─── */

/**
 * Create an integration log entry.
 */
export async function createIntegrationLog(data: {
  formId: number;
  responseId: number;
  integrationType: string;
  status: "pending" | "success" | "failure" | "retrying";
  httpStatus?: number;
  errorMessage?: string;
  requestPayload?: Record<string, any>;
  responseBody?: string;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: Date;
  durationMs?: number;
}) {
  return withDbRetry(async (db) => {
    const result = await db.insert(integrationLogs).values({
      formId: data.formId,
      responseId: data.responseId,
      integrationType: data.integrationType,
      status: data.status,
      httpStatus: data.httpStatus ?? null,
      errorMessage: data.errorMessage ?? null,
      requestPayload: data.requestPayload ?? null,
      responseBody: data.responseBody?.substring(0, 5000) ?? null,
      retryCount: data.retryCount ?? 0,
      maxRetries: data.maxRetries ?? 3,
      nextRetryAt: data.nextRetryAt ?? null,
      durationMs: data.durationMs ?? null,
    });
    return { id: result[0].insertId };
  });
}

/**
 * Update an integration log entry (e.g., after retry).
 */
export async function updateIntegrationLog(id: number, data: {
  status?: "pending" | "success" | "failure" | "retrying";
  httpStatus?: number;
  errorMessage?: string;
  responseBody?: string;
  retryCount?: number;
  nextRetryAt?: Date | null;
  durationMs?: number;
}) {
  return withDbRetry(async (db) => {
    await db.update(integrationLogs)
      .set({
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.httpStatus !== undefined ? { httpStatus: data.httpStatus } : {}),
        ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
        ...(data.responseBody !== undefined ? { responseBody: data.responseBody?.substring(0, 5000) } : {}),
        ...(data.retryCount !== undefined ? { retryCount: data.retryCount } : {}),
        ...(data.nextRetryAt !== undefined ? { nextRetryAt: data.nextRetryAt } : {}),
        ...(data.durationMs !== undefined ? { durationMs: data.durationMs } : {}),
      })
      .where(eq(integrationLogs.id, id));
  });
}

/**
 * Get integration logs for a form, ordered by most recent first.
 */
export async function getIntegrationLogsByForm(formId: number, limit = 50, offset = 0) {
  return withDbRetry(async (db) => {
    return db.select()
      .from(integrationLogs)
      .where(eq(integrationLogs.formId, formId))
      .orderBy(desc(integrationLogs.createdAt))
      .limit(limit)
      .offset(offset);
  });
}

/**
 * Get integration logs for a specific response.
 */
export async function getIntegrationLogsByResponse(responseId: number) {
  return withDbRetry(async (db) => {
    return db.select()
      .from(integrationLogs)
      .where(eq(integrationLogs.responseId, responseId))
      .orderBy(desc(integrationLogs.createdAt));
  });
}

/**
 * Get pending retry logs (status = 'retrying' and nextRetryAt <= now).
 */
export async function getPendingRetryLogs(limit = 20) {
  return withDbRetry(async (db) => {
    return db.select()
      .from(integrationLogs)
      .where(
        and(
          eq(integrationLogs.status, "retrying"),
          lte(integrationLogs.nextRetryAt, new Date()),
        )
      )
      .orderBy(asc(integrationLogs.nextRetryAt))
      .limit(limit);
  });
}

/**
 * Count integration logs by status for a form.
 */
export async function countIntegrationLogsByForm(formId: number) {
  return withDbRetry(async (db) => {
    const rows = await db.select({
      status: integrationLogs.status,
      count: sql<number>`COUNT(*)`,
    })
      .from(integrationLogs)
      .where(eq(integrationLogs.formId, formId))
      .groupBy(integrationLogs.status);

    const counts: Record<string, number> = { pending: 0, success: 0, failure: 0, retrying: 0 };
    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }
    return counts;
  });
}

/**
 * Get global integration logs across all forms (for Settings > Integrações).
 * Supports filtering by status, integrationType, formId and date range.
 */
export async function getGlobalIntegrationLogs(opts: {
  limit?: number;
  offset?: number;
  status?: string;
  integrationType?: string;
  formId?: number;
  since?: Date;
}) {
  const { limit = 100, offset = 0, status, integrationType, formId, since } = opts;
  return withDbRetry(async (db) => {
    const conditions = [];
    if (status) conditions.push(sql`${integrationLogs.status} = ${status}`);
    if (integrationType) conditions.push(eq(integrationLogs.integrationType, integrationType));
    if (formId) conditions.push(eq(integrationLogs.formId, formId));
    if (since) conditions.push(sql`${integrationLogs.createdAt} >= ${since}`);

    const rows = await db.select({
      id: integrationLogs.id,
      formId: integrationLogs.formId,
      responseId: integrationLogs.responseId,
      integrationType: integrationLogs.integrationType,
      status: integrationLogs.status,
      httpStatus: integrationLogs.httpStatus,
      errorMessage: integrationLogs.errorMessage,
      retryCount: integrationLogs.retryCount,
      durationMs: integrationLogs.durationMs,
      createdAt: integrationLogs.createdAt,
      nextRetryAt: integrationLogs.nextRetryAt,
      formTitle: forms.title,
    })
      .from(integrationLogs)
      .leftJoin(forms, eq(integrationLogs.formId, forms.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(integrationLogs.createdAt))
      .limit(limit)
      .offset(offset);
    return rows;
  });
}

/**
 * Get global integration stats (counts by status) for the Settings page.
 */
export async function getGlobalIntegrationStats() {
  return withDbRetry(async (db) => {
    // Use raw SQL to avoid Drizzle enum column type issues with groupBy
    type StatusRow = { status: string; count: number };
    type TypeRow = { integrationType: string; count: number; successCount: number; failureCount: number };

    const [statusRows, typeRows] = await Promise.all([
      db.execute(
        sql`SELECT status, COUNT(*) as count FROM integration_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY status`
      ),
      db.execute(
        sql`SELECT integration_type as integrationType, COUNT(*) as count,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successCount,
            SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failureCount
            FROM integration_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY integration_type`
      ),
    ]);

    const byStatus: Record<string, number> = { pending: 0, success: 0, failure: 0, retrying: 0 };
    const statusData = Array.isArray(statusRows) ? statusRows : (statusRows as any)[0] ?? [];
    for (const row of statusData) {
      byStatus[(row as StatusRow).status] = Number((row as StatusRow).count);
    }

    const typeData = Array.isArray(typeRows) ? typeRows : (typeRows as any)[0] ?? [];
    return {
      byStatus,
      byType: typeData.map((r: TypeRow) => ({
        type: r.integrationType,
        total: Number(r.count),
        success: Number(r.successCount),
        failure: Number(r.failureCount),
      })),
    };
  });
}


/* ─── SMS Logs ─── */

export function logSms(data: { phone: string; formId?: number; verificationSid?: string; status: string }) {
  return withDbRetry(async (db) => {
    await db.insert(smsLogs).values({
      phone: data.phone,
      formId: data.formId ?? null,
      verificationSid: data.verificationSid ?? null,
      status: data.status,
    });
  });
}

export function getSmsCountThisMonth() {
  return withDbRetry(async (db) => {
    const rows = await db.execute(
      sql`SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'rate_limited' THEN 1 ELSE 0 END) as rateLimited
          FROM sms_logs
          WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')`
    );
    const data = Array.isArray(rows) ? rows : (rows as any)[0] ?? [];
    const row = data[0] ?? { total: 0, sent: 0, verified: 0, failed: 0, rateLimited: 0 };
    return {
      total: Number(row.total ?? 0),
      sent: Number(row.sent ?? 0),
      verified: Number(row.verified ?? 0),
      failed: Number(row.failed ?? 0),
      rateLimited: Number(row.rateLimited ?? 0),
    };
  });
}

export function getSmsDailyStats(days: number = 30) {
  return withDbRetry(async (db) => {
    const rows = await db.execute(
      sql`SELECT 
            DATE(createdAt) as date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified
          FROM sms_logs
          WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
          GROUP BY DATE(createdAt)
          ORDER BY date ASC`
    );
    const data = Array.isArray(rows) ? rows : (rows as any)[0] ?? [];
    return data.map((r: any) => ({
      date: r.date,
      total: Number(r.total ?? 0),
      sent: Number(r.sent ?? 0),
      verified: Number(r.verified ?? 0),
    }));
  });
}

/**
 * Find the most recent incomplete (partial) response for a given form + identifier.
 * Used to offer "continue where you left off" when the client fills in their CPF or email.
 * @param formId - the form to search within
 * @param identifier - CPF/CNPJ or email address of the respondent
 * @returns The most recent partial response, or null if none found
 */
export async function findPartialResponseByIdentifier(formId: number, identifier: string) {
  return withDbRetry(async (db) => {
    const normalizedId = identifier.trim().toLowerCase();
    const results = await db.select({
      id: formResponses.id,
      formId: formResponses.formId,
      answers: formResponses.answers,
      respondentName: formResponses.respondentName,
      respondentEmail: formResponses.respondentEmail,
      respondentCpfCnpj: formResponses.respondentCpfCnpj,
      isComplete: formResponses.isComplete,
      createdAt: formResponses.createdAt,
      lastActivityAt: formResponses.lastActivityAt,
    })
      .from(formResponses)
      .where(
        and(
          eq(formResponses.formId, formId),
          eq(formResponses.isComplete, false),
          isNull(formResponses.deletedAt),
          or(
            like(formResponses.respondentEmail, normalizedId),
            like(formResponses.respondentCpfCnpj, identifier.replace(/\D/g, "").substring(0, 20)),
          )
        )
      )
      .orderBy(desc(formResponses.lastActivityAt))
      .limit(1);
    return results[0] ?? null;
  });
}
