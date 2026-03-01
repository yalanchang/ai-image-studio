import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "premium", "admin"]).default("user").notNull(),
  credits: int("credits").default(100).notNull(),
  totalGenerated: int("totalGenerated").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Image Jobs (generation / editing queue) ──────────────────────────────────
export const imageJobs = mysqlTable("image_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobType: mysqlEnum("jobType", [
    "generate",
    "edit",
    "style_transfer",
    "background_replace",
    "object_remove",
    "upscale",
  ]).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  prompt: text("prompt").notNull(),
  negativePrompt: text("negativePrompt"),
  optimizedPrompt: text("optimizedPrompt"),
  style: varchar("style", { length: 64 }),
  aspectRatio: varchar("aspectRatio", { length: 16 }).default("1:1"),
  quality: mysqlEnum("quality", ["standard", "hd", "ultra"]).default("standard"),
  sourceImageUrl: text("sourceImageUrl"),
  resultImageUrl: text("resultImageUrl"),
  resultImageKey: text("resultImageKey"),
  thumbnailUrl: text("thumbnailUrl"),
  creditCost: int("creditCost").default(0).notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImageJob = typeof imageJobs.$inferSelect;
export type InsertImageJob = typeof imageJobs.$inferInsert;

// ─── Credit Transactions ──────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["earn", "spend", "recharge", "refund", "bonus"]).notNull(),
  amount: int("amount").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: text("description").notNull(),
  referenceId: varchar("referenceId", { length: 128 }),
  referenceType: varchar("referenceType", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Gallery (public community feed) ─────────────────────────────────────────
export const galleryItems = mysqlTable("gallery_items", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().unique(),
  userId: int("userId").notNull(),
  userName: text("userName"),
  userAvatar: text("userAvatar"),
  title: varchar("title", { length: 256 }),
  prompt: text("prompt"),
  style: varchar("style", { length: 64 }),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  likes: int("likes").default(0).notNull(),
  views: int("views").default(0).notNull(),
  tags: json("tags"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = typeof galleryItems.$inferInsert;

// ─── Gallery Likes ────────────────────────────────────────────────────────────
export const galleryLikes = mysqlTable("gallery_likes", {
  id: int("id").autoincrement().primaryKey(),
  galleryItemId: int("galleryItemId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryLike = typeof galleryLikes.$inferSelect;

// ─── Credit Packages (admin-defined recharge options) ─────────────────────────
export const creditPackages = mysqlTable("credit_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  credits: int("credits").notNull(),
  price: float("price").notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPackage = typeof creditPackages.$inferSelect;
