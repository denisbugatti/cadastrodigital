/**
 * Audit Log Service — Records important actions for traceability.
 * Use logAudit() to record actions from tRPC procedures.
 */
import { getDb } from "./db";
import { auditLogs, type InsertAuditLog } from "../drizzle/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

/* ─── Action Constants ─── */
export const AUDIT_ACTIONS = {
  // Form actions
  FORM_CREATE: "form.create",
  FORM_UPDATE: "form.update",
  FORM_DELETE: "form.delete",
  FORM_DUPLICATE: "form.duplicate",
  FORM_ASSIGN: "form.assign",
  FORM_UNASSIGN: "form.unassign",
  FORM_TEMPLATE_SYNC: "form.template_sync",

  // Staff actions
  STAFF_INVITE: "staff.invite",
  STAFF_UPDATE_ROLE: "staff.update_role",
  STAFF_DEACTIVATE: "staff.deactivate",
  STAFF_ACTIVATE: "staff.activate",
  STAFF_DELETE: "staff.delete",

  // Response actions
  RESPONSE_VALIDATE: "response.validate",
  RESPONSE_APPROVE: "response.approve",
  RESPONSE_REJECT: "response.reject",
  RESPONSE_EXPORT: "response.export",

  // Access actions
  ACCESS_BLOCKED: "access.blocked",
  ACCESS_LOGIN: "access.login",
  ACCESS_LOGOUT: "access.logout",

  // Settings actions
  SETTINGS_UPDATE: "settings.update",
  SETTINGS_PERMISSIONS: "settings.permissions",

  // Cadence actions
  CADENCE_START: "cadence.start",
  CADENCE_STOP: "cadence.stop",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/* ─── Category mapping ─── */
function getCategoryForAction(action: string): "form" | "staff" | "response" | "access" | "settings" {
  const prefix = action.split(".")[0];
  switch (prefix) {
    case "form": return "form";
    case "staff": return "staff";
    case "response": return "response";
    case "access": return "access";
    case "settings": return "settings";
    case "cadence": return "settings";
    default: return "settings";
  }
}

/* ─── Severity mapping ─── */
function getSeverityForAction(action: string): "info" | "warning" | "critical" {
  if (action.includes("delete") || action.includes("blocked")) return "warning";
  if (action.includes("deactivate")) return "warning";
  return "info";
}

/* ─── Log Audit Entry ─── */
export interface LogAuditParams {
  action: AuditAction | string;
  staffUserId?: number | null;
  staffName?: string | null;
  staffRole?: string | null;
  targetType?: string | null;
  targetId?: number | null;
  targetName?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  severity?: "info" | "warning" | "critical";
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const entry: InsertAuditLog = {
      action: params.action,
      category: getCategoryForAction(params.action),
      staffUserId: params.staffUserId ?? null,
      staffName: params.staffName ?? null,
      staffRole: params.staffRole ?? null,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      targetName: params.targetName ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      severity: params.severity ?? getSeverityForAction(params.action),
    };
    await getDb().insert(auditLogs).values(entry);
  } catch (err) {
    // Never let audit logging break the main flow
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}

/* ─── Query Audit Logs ─── */
export interface QueryAuditParams {
  category?: string;
  action?: string;
  staffUserId?: number;
  search?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(params: QueryAuditParams) {
  const conditions = [];

  if (params.category) {
    conditions.push(eq(auditLogs.category, params.category as any));
  }
  if (params.action) {
    conditions.push(eq(auditLogs.action, params.action));
  }
  if (params.staffUserId) {
    conditions.push(eq(auditLogs.staffUserId, params.staffUserId));
  }
  if (params.severity) {
    conditions.push(eq(auditLogs.severity, params.severity as any));
  }
  if (params.search) {
    conditions.push(
      sql`(${auditLogs.staffName} LIKE ${`%${params.search}%`} OR ${auditLogs.targetName} LIKE ${`%${params.search}%`} OR ${auditLogs.action} LIKE ${`%${params.search}%`})`
    );
  }
  if (params.startDate) {
    conditions.push(gte(auditLogs.createdAt, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(auditLogs.createdAt, params.endDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const [logs, countResult] = await Promise.all([
    getDb()
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    getDb()
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where),
  ]);

  return {
    logs,
    total: countResult[0]?.count ?? 0,
    limit,
    offset,
  };
}
