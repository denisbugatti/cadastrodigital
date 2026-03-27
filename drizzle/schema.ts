import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Platform users — staff accounts (Master, Diretor, Gerente, Corretor).
 * These users log in with email + password.
 * The "users" table is kept for backward compatibility with Manus OAuth.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Staff users — the main authentication table for platform staff.
 * Roles: master, diretor, gerente, corretor
 * Master has unrestricted access to everything.
 */
export const staffUsers = mysqlTable("staff_users", {
  id: int("id").autoincrement().primaryKey(),
  /** Email used for login */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Bcrypt hashed password */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Display name */
  name: varchar("name", { length: 500 }).notNull(),
  /** Phone number */
  phone: varchar("phone", { length: 50 }),
  /** Role in the hierarchy */
  role: mysqlEnum("role", ["master", "diretor", "gerente", "corretor"]).notNull(),
  /** Whether the account is active */
  active: boolean("active").default(true).notNull(),
  /** Who invited this user (staff_users.id) */
  invitedBy: int("invitedBy"),
  /** For gerente/corretor: which team/group they belong to */
  teamId: int("teamId"),
  /** Manager ID — links corretor to their gerente (staff_users.id) */
  managerId: int("managerId"),
  /** Avatar URL */
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type StaffUser = typeof staffUsers.$inferSelect;
export type InsertStaffUser = typeof staffUsers.$inferInsert;

/**
 * Client users — customers who fill forms and track their status.
 * They log in with CPF/CNPJ + password.
 */
export const clientUsers = mysqlTable("client_users", {
  id: int("id").autoincrement().primaryKey(),
  /** CPF (11 digits) or CNPJ (14 digits) — used as login identifier */
  cpfCnpj: varchar("cpfCnpj", { length: 20 }).notNull().unique(),
  /** Bcrypt hashed password */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Display name */
  name: varchar("name", { length: 500 }).notNull(),
  /** Email for notifications */
  email: varchar("email", { length: 320 }),
  /** Phone */
  phone: varchar("phone", { length: 50 }),
  /** Avatar URL */
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type ClientUser = typeof clientUsers.$inferSelect;
export type InsertClientUser = typeof clientUsers.$inferInsert;

/**
 * Invites — sent by master/diretor to onboard new staff users.
 * Contains a unique token sent via email.
 */
export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  /** Email the invite was sent to */
  email: varchar("email", { length: 320 }).notNull(),
  /** Unique invite token */
  token: varchar("token", { length: 255 }).notNull().unique(),
  /** Role to assign when the invite is accepted */
  role: mysqlEnum("role", ["diretor", "gerente", "corretor"]).notNull(),
  /** Who sent the invite (staff_users.id) */
  invitedBy: int("invitedBy").notNull(),
  /** Name for the invited user (pre-filled) */
  name: varchar("name", { length: 500 }),
  /** Phone for the invited user (pre-filled) */
  phone: varchar("phone", { length: 50 }),
  /** When the invite expires */
  expiresAt: timestamp("expiresAt").notNull(),
  /** When the invite was used (null if not yet used) */
  usedAt: timestamp("usedAt"),
  /** Form ID auto-created for this corretor (null if not a corretor or no form created) */
  formId: int("formId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

/**
 * Role permissions — configurable permission matrix.
 * Each row represents a permission for a specific role.
 * The master can edit these permissions.
 */
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Role this permission applies to */
  role: mysqlEnum("role", ["master", "diretor", "gerente", "corretor"]).notNull(),
  /** Permission key (e.g., "view_all_leads", "edit_leads", "delete_leads") */
  permission: varchar("permission", { length: 100 }).notNull(),
  /** Whether this permission is granted */
  granted: boolean("granted").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * Response validations — corretor validates each answer/document in a response.
 */
export const responseValidations = mysqlTable("response_validations", {
  id: int("id").autoincrement().primaryKey(),
  /** Which response this validation belongs to */
  responseId: int("responseId").notNull(),
  /** Which question/field is being validated */
  questionId: varchar("questionId", { length: 100 }).notNull(),
  /** Validation status */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Justification for rejection (required when rejected) */
  justification: text("justification"),
  /** Who validated this (staff_users.id) */
  validatedBy: int("validatedBy"),
  validatedAt: timestamp("validatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseValidation = typeof responseValidations.$inferSelect;
export type InsertResponseValidation = typeof responseValidations.$inferInsert;

/**
 * Forms table — stores the full form configuration as JSON.
 */
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  questions: json("questions").notNull().$type<any[]>(),
  design: json("design").notNull().$type<Record<string, any>>(),
  webhook: json("webhook").$type<Record<string, any>>(),
  sharing: json("sharing").$type<Record<string, any>>(),
  workspaceId: varchar("workspaceId", { length: 255 }),
  status: mysqlEnum("status", ["draft", "published", "closed"]).default("draft").notNull(),
  color: varchar("color", { length: 100 }).default("#0D8BD9"),
  responseCount: int("responseCount").default(0).notNull(),
  /** Staff user assigned to this form (staff_users.id of the corretor) */
  assignedCorretorId: int("assignedCorretorId"),
  /** Parent form ID — if this form is a copy of another form, this tracks the original */
  parentFormId: int("parentFormId"),
  /** Whether this form is a template (protected from editing by gerentes) */
  isTemplate: boolean("isTemplate").default(false).notNull(),
  /** Staff user who created this form (staff_users.id) — null means created by master/owner */
  createdByStaffId: int("createdByStaffId"),
  /** Last seen response count — used to calculate unread badge */
  lastSeenResponseCount: int("lastSeenResponseCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;

/**
 * Form responses — each row is one complete submission.
 */
export const formResponses = mysqlTable("form_responses", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  respondentName: varchar("respondentName", { length: 500 }),
  respondentEmail: varchar("respondentEmail", { length: 320 }),
  /** CPF/CNPJ of the respondent (links to client_users) */
  respondentCpfCnpj: varchar("respondentCpfCnpj", { length: 20 }),
  answers: json("answers").notNull().$type<Record<string, any>>(),
  isComplete: boolean("isComplete").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  protocolCode: varchar("protocolCode", { length: 20 }).unique(),
  timeSpentSeconds: int("timeSpentSeconds"),
  /** Overall validation status */
  validationStatus: mysqlEnum("validationStatus", ["pending", "in_review", "approved", "rejected"]).default("pending").notNull(),
  /** Who is reviewing this response (staff_users.id) */
  reviewedBy: int("reviewedBy"),
  /** When the review was completed */
  reviewedAt: timestamp("reviewedAt"),
  /** Notes from the reviewer */
  reviewNotes: text("reviewNotes"),
  /** When a follow-up email was sent for incomplete submissions */
  followUpSentAt: timestamp("followUpSentAt"),
  /** Last heartbeat/activity from the respondent (updated on each answer or ping) */
  lastActivityAt: timestamp("lastActivityAt").defaultNow(),
  /** When the abandonment notification was sent to the corretor */
  abandonmentNotifiedAt: timestamp("abandonmentNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;

/**
 * Form versions — stores snapshots of the form for version history.
 */
export const formVersions = mysqlTable("form_versions", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  snapshot: json("snapshot").notNull().$type<Record<string, any>>(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormVersion = typeof formVersions.$inferSelect;
export type InsertFormVersion = typeof formVersions.$inferInsert;

/**
 * Files — metadata for files uploaded to S3.
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  fileKey: varchar("fileKey", { length: 1000 }).notNull(),
  url: text("url").notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  sizeBytes: int("sizeBytes"),
  uploadedBy: int("uploadedBy"),
  formId: int("formId"),
  responseId: int("responseId"),
  context: varchar("context", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileRecord = typeof files.$inferSelect;
export type InsertFileRecord = typeof files.$inferInsert;

/**
 * Workspaces — folders to organize forms.
 */
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  description: text("description"),
  designDefaults: json("designDefaults").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Push subscriptions — stores Web Push API subscriptions.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Corretores (Real estate agents) — manages agents who receive notifications.
 * NOTE: This is the legacy table. New corretor accounts are in staff_users.
 * Kept for backward compatibility with existing form-corretor associations.
 */
export const corretores = mysqlTable("corretores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  active: boolean("active").default(true).notNull(),
  /** Link to staff_users.id if this corretor has a platform account */
  staffUserId: int("staffUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Corretor = typeof corretores.$inferSelect;
export type InsertCorretor = typeof corretores.$inferInsert;

/**
 * Form-Corretor association — which corretores are notified for which forms.
 */
export const formCorretores = mysqlTable("form_corretores", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  corretorId: int("corretorId").notNull(),
  notifyOnSubmission: boolean("notifyOnSubmission").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormCorretor = typeof formCorretores.$inferSelect;
export type InsertFormCorretor = typeof formCorretores.$inferInsert;


/**
 * Site settings — global configuration for the site (OG tags, branding, etc.).
 * Only one row should exist (singleton pattern with key="default").
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique key for the settings row (e.g., "default") */
  key: varchar("key", { length: 64 }).notNull().unique(),
  /** OG title shown when sharing on WhatsApp/social media */
  ogTitle: varchar("ogTitle", { length: 500 }),
  /** OG description shown when sharing */
  ogDescription: text("ogDescription"),
  /** OG image URL shown when sharing */
  ogImage: text("ogImage"),
  /** Site URL for OG tags */
  ogUrl: varchar("ogUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

/**
 * Email cadence — tracks automated email sequences for incomplete/rejected submissions.
 * Cadence types:
 *   - "abandono" → incomplete form submissions (3x/week for 2 months)
 *   - "reprovacao" → rejected submissions that need correction (3x/week for 2 months)
 * Schedule: Monday, Wednesday, Friday at 9am BRT (UTC-3)
 * Duration: 2 months (~24 emails total: 3/week × ~8 weeks)
 */
export const emailCadence = mysqlTable("email_cadence", {
  id: int("id").autoincrement().primaryKey(),
  /** Which response this cadence is for */
  responseId: int("responseId").notNull(),
  /** Which form this belongs to */
  formId: int("formId").notNull(),
  /** Type of cadence */
  cadenceType: mysqlEnum("cadenceType", ["abandono", "reprovacao"]).notNull(),
  /** Recipient email */
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  /** Recipient name */
  recipientName: varchar("recipientName", { length: 500 }),
  /** Rejection reason (only for reprovacao type) */
  rejectionReason: text("rejectionReason"),
  /** Current sequence number (1-based, increments with each send) */
  sequenceNumber: int("sequenceNumber").default(0).notNull(),
  /** Maximum emails to send (default 24 = 3/week × 8 weeks) */
  maxSequence: int("maxSequence").default(24).notNull(),
  /** When the next email should be sent (null = cadence complete or paused) */
  nextSendAt: timestamp("nextSendAt"),
  /** When the last email was sent */
  lastSentAt: timestamp("lastSentAt"),
  /** Whether this cadence is active */
  active: boolean("active").default(true).notNull(),
  /** Why the cadence was stopped */
  stoppedReason: mysqlEnum("stoppedReason", ["completed", "form_completed", "form_approved", "manual", "max_reached"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCadence = typeof emailCadence.$inferSelect;
export type InsertEmailCadence = typeof emailCadence.$inferInsert;

/**
 * Activity log — tracks all events for a response (timeline).
 * Used to display a chronological history of actions on each response card.
 */
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  /** Which response this activity belongs to */
  responseId: int("responseId").notNull(),
  /** Which form this belongs to */
  formId: int("formId").notNull(),
  /** Type of activity */
  activityType: mysqlEnum("activityType", [
    "response_created",
    "response_completed",
    "validation_started",
    "field_approved",
    "field_rejected",
    "overall_approved",
    "overall_rejected",
    "cadence_started",
    "cadence_email_sent",
    "cadence_stopped",
    "follow_up_sent",
    "pdf_generated",
    "rejection_email_sent",
    "approval_email_sent",
    "protocol_email_sent",
    "abandonment_detected",
  ]).notNull(),
  /** Human-readable description */
  description: text("description"),
  /** Additional metadata (JSON) */
  metadata: json("metadata").$type<Record<string, any>>(),
  /** Who performed this action (staff_users.id, null for system actions) */
  performedBy: int("performedBy"),
  /** Name of who performed (cached for display) */
  performedByName: varchar("performedByName", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Staff push subscriptions — stores Web Push API subscriptions for staff users (corretores, gerentes, etc.).
 */
export const staffPushSubscriptions = mysqlTable("staff_push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  staffUserId: int("staffUserId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffPushSubscription = typeof staffPushSubscriptions.$inferSelect;
export type InsertStaffPushSubscription = typeof staffPushSubscriptions.$inferInsert;

/**
 * Response folders — corretores can create folders to organize responses.
 * Each folder belongs to a staff user and has a name and optional color.
 */
export const responseFolders = mysqlTable("response_folders", {
  id: int("id").autoincrement().primaryKey(),
  /** Staff user who owns this folder */
  staffUserId: int("staffUserId").notNull(),
  /** Folder name */
  name: varchar("name", { length: 200 }).notNull(),
  /** Optional color for visual distinction (hex or tailwind color name) */
  color: varchar("color", { length: 30 }).default("#6366f1"),
  /** Sort order */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseFolder = typeof responseFolders.$inferSelect;
export type InsertResponseFolder = typeof responseFolders.$inferInsert;

/**
 * Response-folder assignments — maps responses to folders.
 * A response can be in one folder per staff user.
 */
export const responseFolderAssignments = mysqlTable("response_folder_assignments", {
  id: int("id").autoincrement().primaryKey(),
  /** The response being organized */
  responseId: int("responseId").notNull(),
  /** The folder it belongs to */
  folderId: int("folderId").notNull(),
  /** Staff user who made this assignment */
  staffUserId: int("staffUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResponseFolderAssignment = typeof responseFolderAssignments.$inferSelect;
export type InsertResponseFolderAssignment = typeof responseFolderAssignments.$inferInsert;


/**
 * Audit logs — records important actions for traceability.
 * Tracks who did what, when, and with what details.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Action performed (e.g., form.create, form.delete, staff.invite, access.blocked) */
  action: varchar("action", { length: 100 }).notNull(),
  /** Category for filtering (form, staff, response, access, settings) */
  category: mysqlEnum("category", ["form", "staff", "response", "access", "settings"]).notNull(),
  /** Staff user who performed the action */
  staffUserId: int("staffUserId"),
  /** Staff user name (denormalized for quick display) */
  staffName: varchar("staffName", { length: 500 }),
  /** Staff role at the time of action */
  staffRole: varchar("staffRole", { length: 50 }),
  /** Target entity type (form, staff_user, response, etc.) */
  targetType: varchar("targetType", { length: 100 }),
  /** Target entity ID */
  targetId: int("targetId"),
  /** Target entity name (denormalized) */
  targetName: varchar("targetName", { length: 500 }),
  /** Additional details as JSON */
  details: json("details"),
  /** IP address of the request */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** Severity: info, warning, critical */
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;


/**
 * Form assignments — many-to-many relationship between forms and staff users.
 * Allows admins to assign multiple staff members to each form.
 * Staff members (gerentes/corretores) only see forms assigned to them.
 * Master/diretor always see all forms regardless of assignments.
 */
export const formAssignments = mysqlTable("form_assignments", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  staffUserId: int("staffUserId").notNull(),
  /** Who assigned this user to the form */
  assignedBy: int("assignedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FormAssignment = typeof formAssignments.$inferSelect;
export type InsertFormAssignment = typeof formAssignments.$inferInsert;

/**
 * Staff notifications — in-app notifications for staff users.
 * Used to notify corretores/gerentes about new responses, assignments, etc.
 */
export const staffNotifications = mysqlTable("staff_notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** The staff user who receives this notification */
  staffUserId: int("staffUserId").notNull(),
  /** Notification type: new_response, form_assigned, form_unassigned, etc. */
  type: varchar("type", { length: 50 }).notNull(),
  /** Short title */
  title: varchar("title", { length: 500 }).notNull(),
  /** Body/description */
  body: text("body"),
  /** Whether the notification has been read */
  isRead: boolean("isRead").default(false).notNull(),
  /** Optional link to navigate to when clicked */
  link: varchar("link", { length: 500 }),
  /** Additional metadata as JSON */
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StaffNotification = typeof staffNotifications.$inferSelect;
export type InsertStaffNotification = typeof staffNotifications.$inferInsert;

/**
 * Staff notification preferences — per-user settings for which notification types to receive.
 * Each row represents a notification type preference for a specific staff user.
 * Defaults: all enabled. If no row exists for a type, it’s treated as enabled.
 */
export const staffNotificationPreferences = mysqlTable("staff_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  /** The staff user these preferences belong to */
  staffUserId: int("staffUserId").notNull(),
  /** Notification type key: new_response, response_approved, response_rejected */
  notificationType: varchar("notificationType", { length: 50 }).notNull(),
  /** Whether in-app (sino) notifications are enabled for this type */
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  /** Whether push notifications are enabled for this type */
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaffNotificationPreference = typeof staffNotificationPreferences.$inferSelect;
export type InsertStaffNotificationPreference = typeof staffNotificationPreferences.$inferInsert;


/**
 * Integration logs — tracks every integration dispatch attempt.
 * Used for visibility into integration success/failure and automatic retry.
 */
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Which form triggered this integration */
  formId: int("formId").notNull(),
  /** Which response triggered this integration */
  responseId: int("responseId").notNull(),
  /** Integration type: webhook, googleSheets, crmManus, rdStation, email */
  integrationType: varchar("integrationType", { length: 50 }).notNull(),
  /** Status: pending, success, failure, retrying */
  status: mysqlEnum("status", ["pending", "success", "failure", "retrying"]).default("pending").notNull(),
  /** HTTP status code if applicable */
  httpStatus: int("httpStatus"),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** Request payload (truncated for storage) */
  requestPayload: json("requestPayload").$type<Record<string, any>>(),
  /** Response body (truncated for storage) */
  responseBody: text("responseBody"),
  /** Number of retry attempts */
  retryCount: int("retryCount").default(0).notNull(),
  /** Maximum retries allowed */
  maxRetries: int("maxRetries").default(3).notNull(),
  /** When the next retry should happen (null = no retry scheduled) */
  nextRetryAt: timestamp("nextRetryAt"),
  /** Duration of the request in milliseconds */
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;
