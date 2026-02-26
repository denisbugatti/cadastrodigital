import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users,
  forms, InsertForm,
  formResponses, InsertFormResponse,
  formVersions, InsertFormVersion,
  files, InsertFileRecord,
  workspaces, InsertWorkspace,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _pool: mysql.Pool | null = null;
let _db: any = null;

/**
 * Create a MySQL2 connection pool with keepalive and auto-reconnect.
 * This prevents ECONNRESET errors from TiDB serverless idle timeouts.
 */
function createPool(): mysql.Pool {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 30000,       // Close idle connections after 30s
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Send keepalive every 10s
    connectTimeout: 10000,    // 10s connection timeout
  });

  // Log pool errors but don't crash
  pool.on('connection', () => {
    console.log("[Database] New pool connection established");
  });

  return pool;
}

/**
 * Get the drizzle database instance backed by a connection pool.
 * Automatically recreates the pool if the previous one was destroyed.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool();
      _db = drizzle(_pool);
      console.log("[Database] Connection pool initialized");
    } catch (error) {
      console.warn("[Database] Failed to create pool:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

/**
 * Reset the database connection pool. Call this when queries fail
 * with connection errors so the next getDb() creates a fresh pool.
 */
export async function resetDbConnection() {
  if (_pool) {
    try {
      await _pool.end();
    } catch (e) {
      // Ignore errors when closing stale pool
    }
  }
  _pool = null;
  _db = null;
}

/**
 * Execute a database operation with automatic retry on connection errors.
 * Resets the connection pool on failure and retries with a fresh connection.
 */
async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      const isConnectionError =
        err?.code === 'ECONNRESET' ||
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'PROTOCOL_CONNECTION_LOST' ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('Connection lost') ||
        err?.message?.includes('Failed query') ||
        err?.message?.includes('read ECONNRESET');

      if (isConnectionError && attempt < maxRetries - 1) {
        console.warn(`[Database] Connection error (attempt ${attempt + 1}/${maxRetries}), reconnecting...`, err?.message);
        await resetDbConnection();
        // Force re-init on next getDb() call
        await getDb();
        const delay = 300 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withDbRetry: unreachable");
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot upsert user: database not available");
      return;
    }

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
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot get user: database not available");
      return undefined;
    }
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  });
}

// ─── Forms ───

export async function createForm(data: InsertForm) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(forms).values(data);
    return { id: result[0].insertId };
  });
}

export async function getFormsByUser(userId: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.updatedAt));
  });
}

export async function getFormBySlug(slug: string) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);
    return result[0] ?? null;
  });
}

export async function getFormById(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateForm(id: number, data: Partial<InsertForm>) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(forms).set(data).where(eq(forms.id, id));
  });
}

export async function deleteForm(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(formVersions).where(eq(formVersions.formId, id));
    await db.delete(formResponses).where(eq(formResponses.formId, id));
    await db.delete(files).where(eq(files.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  });
}

export async function duplicateForm(id: number, userId: number, newSlug: string) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const original = await getFormById(id);
    if (!original) throw new Error("Form not found");
    const result = await db.insert(forms).values({
      slug: newSlug,
      userId,
      title: `${original.title} (cópia)`,
      description: original.description,
      questions: original.questions,
      design: original.design,
      webhook: original.webhook,
      sharing: original.sharing,
      workspaceId: original.workspaceId,
      status: "draft",
      color: original.color,
      responseCount: 0,
    });
    return { id: result[0].insertId };
  });
}

// ─── Form Responses ───

export async function createResponse(data: InsertFormResponse) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(formResponses).values(data);
    await db.update(forms).set({ responseCount: sql`${forms.responseCount} + 1` }).where(eq(forms.id, data.formId));
    return { id: result[0].insertId };
  });
}

export async function getResponsesByForm(formId: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.createdAt));
  });
}

export async function getResponseById(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(formResponses).where(eq(formResponses.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateResponse(id: number, data: Partial<InsertFormResponse>) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(formResponses).set(data).where(eq(formResponses.id, id));
  });
}

// ─── Form Versions ───

export async function createVersion(data: InsertFormVersion) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
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
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(formVersions).where(eq(formVersions.formId, formId)).orderBy(desc(formVersions.createdAt));
  });
}

export async function getVersionById(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(formVersions).where(eq(formVersions.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function deleteVersion(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(formVersions).where(eq(formVersions.id, id));
  });
}

// ─── Files ───

export async function createFileRecord(data: InsertFileRecord) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(files).values(data);
    return { id: result[0].insertId };
  });
}

export async function getFilesByForm(formId: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(files).where(eq(files.formId, formId)).orderBy(desc(files.createdAt));
  });
}

export async function getFilesByResponse(responseId: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(files).where(eq(files.responseId, responseId));
  });
}

export async function deleteFileRecord(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(files).where(eq(files.id, id));
  });
}

// ─── Workspaces ───

export async function createWorkspace(data: InsertWorkspace) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(workspaces).values(data);
    return { id: result[0].insertId };
  });
}

export async function getWorkspacesByUser(userId: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(workspaces).where(eq(workspaces.userId, userId)).orderBy(desc(workspaces.createdAt));
  });
}

export async function getWorkspaceById(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0] ?? null;
  });
}

export async function updateWorkspace(id: number, data: Partial<InsertWorkspace>) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(workspaces).set(data).where(eq(workspaces.id, id));
  });
}

export async function deleteWorkspace(id: number) {
  return withDbRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Clear workspaceId from forms in this workspace
    await db.update(forms).set({ workspaceId: null }).where(eq(forms.workspaceId, String(id)));
    await db.delete(workspaces).where(eq(workspaces.id, id));
  });
}
