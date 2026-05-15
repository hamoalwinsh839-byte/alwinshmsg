import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokensTable = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenValue: text("token_value").notNull(),
  label: text("label"),
  status: text("status").notNull().default("unknown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenId: integer("token_id").notNull().references(() => tokensTable.id, { onDelete: "cascade" }),
  serverId: text("server_id"),
  channelId: text("channel_id").notNull(),
  message: text("message").notNull(),
  imagePath: text("image_path"),
  scheduleTime: text("schedule_time").notNull().default("0 * * * *"),
  intervalSeconds: integer("interval_seconds"),
  isActive: boolean("is_active").notNull().default(true),
  sentCount: integer("sent_count").notNull().default(0),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});
