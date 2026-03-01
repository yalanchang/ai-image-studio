import { and, desc, eq, like, or, sql, count, sum, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, imageJobs, creditTransactions, galleryItems, galleryLikes, creditPackages,
  InsertUser, InsertImageJob, InsertCreditTransaction, InsertGalleryItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "avatar"] as const;
  for (const f of textFields) {
    const v = user[f];
    if (v !== undefined) { values[f] = v ?? null; updateSet[f] = v ?? null; }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role; updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin"; updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0];
}

export async function getAllUsers(page = 1, limit = 20, search?: string) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = search
    ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))
    : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);
  return { items, total: Number(total) };
}

export async function updateUserCredits(userId: number, delta: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users)
    .set({ credits: sql`credits + ${delta}`, updatedAt: new Date() })
    .where(eq(users.id, userId));
  const r = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
  return r[0]?.credits ?? 0;
}

export async function updateUserRole(userId: number, role: "user" | "premium" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Image Jobs ───────────────────────────────────────────────────────────────

export async function createImageJob(data: InsertImageJob) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(imageJobs).values(data);
  const id = Number((r as any).insertId);
  const job = await db.select().from(imageJobs).where(eq(imageJobs.id, id)).limit(1);
  return job[0]!;
}

export async function getImageJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(imageJobs).where(eq(imageJobs.id, id)).limit(1);
  return r[0];
}

export async function updateImageJob(id: number, data: Partial<typeof imageJobs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(imageJobs).set({ ...data, updatedAt: new Date() }).where(eq(imageJobs.id, id));
}

export async function getUserImageJobs(
  userId: number,
  page = 1,
  limit = 20,
  search?: string,
  jobType?: string,
  status?: string
) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(imageJobs.userId, userId)];
  if (search) conditions.push(like(imageJobs.prompt, `%${search}%`));
  if (jobType) conditions.push(eq(imageJobs.jobType, jobType as any));
  if (status) conditions.push(eq(imageJobs.status, status as any));
  const where = and(...conditions);
  const [items, [{ total }]] = await Promise.all([
    db.select().from(imageJobs).where(where).orderBy(desc(imageJobs.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(imageJobs).where(where),
  ]);
  return { items, total: Number(total) };
}

export async function deleteImageJob(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(imageJobs).where(and(eq(imageJobs.id, id), eq(imageJobs.userId, userId)));
}

// ─── Credit Transactions ──────────────────────────────────────────────────────

export async function createCreditTransaction(data: InsertCreditTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(creditTransactions).values(data);
}

export async function getUserCreditHistory(userId: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = eq(creditTransactions.userId, userId);
  const [items, [{ total }]] = await Promise.all([
    db.select().from(creditTransactions).where(where).orderBy(desc(creditTransactions.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(creditTransactions).where(where),
  ]);
  return { items, total: Number(total) };
}

export async function getSystemCreditStats() {
  const db = await getDb();
  if (!db) return { totalSpent: 0, totalEarned: 0, totalUsers: 0 };
  const [spent, earned, total] = await Promise.all([
    db.select({ v: sum(creditTransactions.amount) }).from(creditTransactions).where(eq(creditTransactions.type, "spend")),
    db.select({ v: sum(creditTransactions.amount) }).from(creditTransactions).where(eq(creditTransactions.type, "recharge")),
    db.select({ v: count() }).from(users),
  ]);
  return {
    totalSpent: Number(spent[0]?.v ?? 0),
    totalEarned: Number(earned[0]?.v ?? 0),
    totalUsers: Number(total[0]?.v ?? 0),
  };
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function createGalleryItem(data: InsertGalleryItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(galleryItems).values(data);
  const id = Number((r as any).insertId);
  const item = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
  return item[0]!;
}

export async function getGalleryItems(page = 1, limit = 20, featured = false) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const where = featured ? eq(galleryItems.isFeatured, true) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.select().from(galleryItems).where(where).orderBy(desc(galleryItems.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(galleryItems).where(where),
  ]);
  return { items, total: Number(total) };
}

export async function toggleGalleryLike(galleryItemId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(galleryLikes)
    .where(and(eq(galleryLikes.galleryItemId, galleryItemId), eq(galleryLikes.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(galleryLikes).where(and(eq(galleryLikes.galleryItemId, galleryItemId), eq(galleryLikes.userId, userId)));
    await db.update(galleryItems).set({ likes: sql`likes - 1` }).where(eq(galleryItems.id, galleryItemId));
    return false;
  } else {
    await db.insert(galleryLikes).values({ galleryItemId, userId });
    await db.update(galleryItems).set({ likes: sql`likes + 1` }).where(eq(galleryItems.id, galleryItemId));
    return true;
  }
}

export async function getUserLikedIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const r = await db.select({ id: galleryLikes.galleryItemId }).from(galleryLikes).where(eq(galleryLikes.userId, userId));
  return r.map(x => x.id);
}

// ─── Credit Packages ──────────────────────────────────────────────────────────

export async function getCreditPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditPackages).where(eq(creditPackages.isActive, true)).orderBy(creditPackages.credits);
}

export async function upsertCreditPackage(data: typeof creditPackages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.id) {
    await db.update(creditPackages).set(data).where(eq(creditPackages.id, data.id));
  } else {
    await db.insert(creditPackages).values(data);
  }
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const [
    [{ totalUsers }],
    [{ totalJobs }],
    [{ completedJobs }],
    [{ failedJobs }],
    [{ jobsToday }],
    [{ jobsWeek }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ totalJobs: count() }).from(imageJobs),
    db.select({ completedJobs: count() }).from(imageJobs).where(eq(imageJobs.status, "completed")),
    db.select({ failedJobs: count() }).from(imageJobs).where(eq(imageJobs.status, "failed")),
    db.select({ jobsToday: count() }).from(imageJobs).where(gte(imageJobs.createdAt, dayAgo)),
    db.select({ jobsWeek: count() }).from(imageJobs).where(gte(imageJobs.createdAt, weekAgo)),
  ]);
  return {
    totalUsers: Number(totalUsers),
    totalJobs: Number(totalJobs),
    completedJobs: Number(completedJobs),
    failedJobs: Number(failedJobs),
    jobsToday: Number(jobsToday),
    jobsWeek: Number(jobsWeek),
  };
}
