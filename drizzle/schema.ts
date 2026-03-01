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
  /** Project of interest — filled by corretor during validation */
  projectName: varchar("projectName", { length: 500 }),
  /** Generated PDF S3 key */
  pdfKey: varchar("pdfKey", { length: 500 }),
  /** Generated PDF public URL */
  pdfUrl: varchar("pdfUrl", { length: 1000 }),
  /** Extra pages (JSON array of {url, filename, mimeType}) to append to PDF */
  extraPages: json("extraPages").$type<Array<{url: string; filename: string; mimeType: string}>>(),
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
