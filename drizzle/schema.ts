import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
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
 * Forms table — stores the full form configuration as JSON.
 * The questions, design, webhook, sharing settings are all stored as JSON
 * for maximum flexibility (matching the BuilderForm type from the frontend).
 */
export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique slug identifier for the form (e.g., "one_innovation_form") */
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  /** Form title */
  title: varchar("title", { length: 500 }).notNull(),
  /** Form description */
  description: text("description"),
  /** Full questions array as JSON (BuilderQuestion[]) */
  questions: json("questions").notNull().$type<any[]>(),
  /** Design settings as JSON (FormDesignSettings) */
  design: json("design").notNull().$type<Record<string, any>>(),
  /** Webhook settings as JSON (WebhookSettings) */
  webhook: json("webhook").$type<Record<string, any>>(),
  /** Sharing settings as JSON (SharingSettings) */
  sharing: json("sharing").$type<Record<string, any>>(),
  /** Workspace ID (nullable) */
  workspaceId: varchar("workspaceId", { length: 255 }),
  /** Publication status */
  status: mysqlEnum("status", ["draft", "published", "closed"]).default("draft").notNull(),
  /** Card color for dashboard display */
  color: varchar("color", { length: 100 }).default("#0D8BD9"),
  /** Response count (denormalized for performance) */
  responseCount: int("responseCount").default(0).notNull(),
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
  /** Which form this response belongs to */
  formId: int("formId").notNull(),
  /** Respondent identifier (can be anonymous) */
  respondentName: varchar("respondentName", { length: 500 }),
  respondentEmail: varchar("respondentEmail", { length: 320 }),
  /** All answers as JSON: { questionId: answer } */
  answers: json("answers").notNull().$type<Record<string, any>>(),
  /** Whether the response is complete or partial */
  isComplete: boolean("isComplete").default(false).notNull(),
  /** IP address for analytics */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** User agent for analytics */
  userAgent: text("userAgent"),
  /** Unique protocol code for this response */
  protocolCode: varchar("protocolCode", { length: 20 }).unique(),
  /** Time spent filling the form (in seconds) */
  timeSpentSeconds: int("timeSpentSeconds"),
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
  /** Which form this version belongs to */
  formId: int("formId").notNull(),
  /** Version label (auto-generated or user-provided) */
  label: varchar("label", { length: 255 }).notNull(),
  /** Full form snapshot as JSON (the entire BuilderForm object) */
  snapshot: json("snapshot").notNull().$type<Record<string, any>>(),
  /** Who created this version */
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
  /** S3 file key */
  fileKey: varchar("fileKey", { length: 1000 }).notNull(),
  /** Public URL from S3 */
  url: text("url").notNull(),
  /** Original filename */
  filename: varchar("filename", { length: 500 }).notNull(),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 255 }),
  /** File size in bytes */
  sizeBytes: int("sizeBytes"),
  /** Who uploaded this file */
  uploadedBy: int("uploadedBy"),
  /** Associated form ID (nullable) */
  formId: int("formId"),
  /** Associated response ID (nullable) */
  responseId: int("responseId"),
  /** Context: "form-logo", "form-background", "question-image", "response-attachment" */
  context: varchar("context", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileRecord = typeof files.$inferSelect;
export type InsertFileRecord = typeof files.$inferInsert;

/**
 * Workspaces — folders to organize forms with custom domains.
 */
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  description: text("description"),
  /** Default design settings for forms in this workspace */
  designDefaults: json("designDefaults").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Push subscriptions — stores Web Push API subscriptions for push notifications.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID (who will receive notifications) */
  userId: int("userId").notNull(),
  /** The push subscription endpoint URL */
  endpoint: text("endpoint").notNull(),
  /** The p256dh key for encryption */
  p256dh: text("p256dh").notNull(),
  /** The auth secret for encryption */
  auth: text("auth").notNull(),
  /** User agent of the subscribing browser */
  userAgent: text("userAgent"),
  /** Whether this subscription is active */
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Corretores (Real estate agents) — manages agents who receive notifications.
 */
export const corretores = mysqlTable("corretores", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID (who created this corretor) */
  userId: int("userId").notNull(),
  /** Corretor name */
  name: varchar("name", { length: 500 }).notNull(),
  /** Corretor email (for notifications) */
  email: varchar("email", { length: 320 }).notNull(),
  /** Corretor phone (optional) */
  phone: varchar("phone", { length: 50 }),
  /** Whether this corretor is active */
  active: boolean("active").default(true).notNull(),
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
  /** Form ID */
  formId: int("formId").notNull(),
  /** Corretor ID */
  corretorId: int("corretorId").notNull(),
  /** Whether notifications are enabled for this association */
  notifyOnSubmission: boolean("notifyOnSubmission").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormCorretor = typeof formCorretores.$inferSelect;
export type InsertFormCorretor = typeof formCorretores.$inferInsert;
