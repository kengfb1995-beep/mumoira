import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: integer("balance").notNull().default(0),
  role: text("role", { enum: ["super_admin", "admin", "user"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const servers = sqliteTable("servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  version: text("version").notNull(),
  exp: text("exp").notNull(),
  drop: text("drop").notNull(),
  openBetaDate: integer("open_beta_date", { mode: "timestamp_ms" }),
  alphaTestDate: integer("alpha_test_date", { mode: "timestamp_ms" }),
  websiteUrl: text("website_url").notNull(),
  bannerUrl: text("banner_url"),
  vipPackageType: text("vip_package_type", {
    enum: ["vip_gold", "vip_silver", "none"],
  })
    .notNull()
    .default("none"),
  status: text("status", { enum: ["draft", "pending", "active", "archived"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const banners = sqliteTable("banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  position: text("position", {
    enum: ["center_top", "left_sidebar", "right_sidebar", "center_mid", "center_bottom"],
  }).notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["pending", "active", "expired", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  originalUrl: text("original_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "success", "failed", "cancelled"] })
    .notNull()
    .default("pending"),
  serviceType: text("service_type", {
    enum: [
      "topup",
      "vip_gold",
      "vip_silver",
      "banner_left_sidebar",
      "banner_right_sidebar",
      "banner_center_top",
      "banner_center_mid",
      "banner_center_bottom",
    ],
  }).default("topup"),
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const adminAudits = sqliteTable("admin_audits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminUserId: integer("admin_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  payload: text("payload"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const incidentAcks = sqliteTable("incident_acks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: text("incident_id").notNull().unique(),
  incidentType: text("incident_type").notNull(),
  status: text("status", { enum: ["open", "acknowledged", "resolved"] }).notNull().default("open"),
  acknowledgedByUserId: integer("acknowledged_by_user_id").references(() => users.id, { onDelete: "set null" }),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" }),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  slaDueAt: integer("sla_due_at", { mode: "timestamp_ms" }),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const cronRuns = sqliteTable("cron_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskName: text("task_name").notNull(),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
  statusCode: integer("status_code"),
  processedCount: integer("processed_count").notNull().default(0),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  runDate: text("run_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const usersRelations = relations(users, ({ many }) => ({
  servers: many(servers),
  banners: many(banners),
  transactions: many(transactions),
  adminAudits: many(adminAudits),
}));

export const serversRelations = relations(servers, ({ one }) => ({
  user: one(users, {
    fields: [servers.userId],
    references: [users.id],
  }),
}));

export const bannersRelations = relations(banners, ({ one }) => ({
  user: one(users, {
    fields: [banners.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const adminAuditsRelations = relations(adminAudits, ({ one }) => ({
  adminUser: one(users, {
    fields: [adminAudits.adminUserId],
    references: [users.id],
  }),
}));

export const incidentAcksRelations = relations(incidentAcks, ({ one }) => ({
  acknowledgedByUser: one(users, {
    fields: [incidentAcks.acknowledgedByUserId],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [incidentAcks.assignedToUserId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type AdminAudit = typeof adminAudits.$inferSelect;
export type NewAdminAudit = typeof adminAudits.$inferInsert;
export type CronRun = typeof cronRuns.$inferSelect;
export type NewCronRun = typeof cronRuns.$inferInsert;
export type IncidentAck = typeof incidentAcks.$inferSelect;
export type NewIncidentAck = typeof incidentAcks.$inferInsert;
