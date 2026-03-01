import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserImageJobs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  createImageJob: vi.fn().mockResolvedValue({ id: 1, userId: 1, prompt: "test", jobType: "generate", status: "pending", creditCost: 10 }),
  getImageJobById: vi.fn().mockResolvedValue({ id: 1, userId: 1, prompt: "test", jobType: "generate", status: "pending", creditCost: 10, isPublic: false }),
  deleteImageJob: vi.fn().mockResolvedValue(undefined),
  updateImageJob: vi.fn().mockResolvedValue(undefined),
  updateUserCredits: vi.fn().mockResolvedValue(90),
  createCreditTransaction: vi.fn().mockResolvedValue(undefined),
  getUserCreditHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getGalleryItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  createGalleryItem: vi.fn().mockResolvedValue({ id: 1 }),
  toggleGalleryLike: vi.fn().mockResolvedValue(true),
  getUserLikedIds: vi.fn().mockResolvedValue([]),
  getCreditPackages: vi.fn().mockResolvedValue([]),
  upsertCreditPackage: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 5, totalJobs: 20, completedJobs: 18, failedJobs: 2, jobsToday: 3, jobsWeek: 10 }),
  getSystemCreditStats: vi.fn().mockResolvedValue({ totalSpent: 500, totalEarned: 1000, totalUsers: 5 }),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test User" }),
}));

vi.mock("./jobQueue", () => ({
  calculateCreditCost: vi.fn().mockReturnValue(10),
  processImageJob: vi.fn().mockResolvedValue(undefined),
  CREDIT_COSTS: { generate: 10, edit: 15 },
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Enhanced: a beautiful sunset over mountains" } }],
  }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeUser(overrides: Partial<TrpcContext["user"]> = {}): NonNullable<TrpcContext["user"]> {
  return {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    avatar: null,
    loginMethod: "manus",
    role: "user",
    credits: 100,
    totalGenerated: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: NonNullable<TrpcContext["user"]> | null = makeUser()): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }) } as any,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      user: makeUser(),
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }) } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns current user when authenticated", async () => {
    const user = makeUser();
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("credits.balance", () => {
  it("returns user credit balance", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ credits: 250 })));
    const result = await caller.credits.balance();
    expect(result.credits).toBe(250);
  });
});

describe("credits.history", () => {
  it("returns empty history for new user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.credits.history({ page: 1, limit: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("images.list", () => {
  it("returns empty list for new user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.images.list({ page: 1, limit: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("images.create", () => {
  it("creates a job when user has enough credits", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ credits: 100 })));
    const result = await caller.images.create({
      jobType: "generate",
      prompt: "A beautiful mountain landscape",
      quality: "standard",
      aspectRatio: "1:1",
      isPublic: false,
    });
    expect(result.jobId).toBe(1);
    expect(result.creditCost).toBe(10);
    expect(result.creditsRemaining).toBe(90);
  });

  it("throws PRECONDITION_FAILED when user has insufficient credits", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ credits: 5 })));
    await expect(
      caller.images.create({
        jobType: "generate",
        prompt: "A beautiful mountain landscape",
        quality: "standard",
        aspectRatio: "1:1",
        isPublic: false,
      })
    ).rejects.toThrow("Insufficient credits");
  });
});

describe("gallery.list", () => {
  it("returns empty gallery", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.gallery.list({ page: 1, limit: 20, featured: false });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("prompt.optimize", () => {
  it("returns optimized prompt", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.prompt.optimize({ prompt: "sunset mountains" });
    expect(result.original).toBe("sunset mountains");
    expect(result.optimized).toContain("Enhanced");
  });
});

describe("admin.stats", () => {
  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    const result = await caller.admin.stats();
    expect(result.totalUsers).toBe(5);
    expect(result.totalJobs).toBe(20);
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "user" })));
    await expect(caller.admin.stats()).rejects.toThrow("Admin access required");
  });
});

describe("images.creditCosts", () => {
  it("returns credit cost map", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.images.creditCosts();
    expect(result.generate).toBe(10);
    expect(result.edit).toBe(15);
  });
});
