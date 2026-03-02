import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getUserImageJobs, createImageJob, getImageJobById, deleteImageJob,
  updateUserCredits, createCreditTransaction, getUserCreditHistory,
  getGalleryItems, createGalleryItem, toggleGalleryLike, getUserLikedIds,
  getCreditPackages, upsertCreditPackage,
  getAllUsers, updateUserRole, getAdminStats, getSystemCreditStats,
  updateImageJob,
} from "./db";
import { calculateCreditCost, processImageJob, CREDIT_COSTS } from "./jobQueue";
import { invokeLLM } from "./_core/llm";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Images ────────────────────────────────────────────────────────────────
  images: router({
    // Create a new image generation/editing job
    create: protectedProcedure
      .input(z.object({
        jobType: z.enum(["generate", "edit", "style_transfer", "background_replace", "object_remove", "upscale"]),
        prompt: z.string().min(1).max(2000),
        negativePrompt: z.string().max(500).optional(),
        style: z.string().max(64).optional(),
        aspectRatio: z.string().default("1:1"),
        quality: z.enum(["standard", "hd", "ultra"]).default("standard"),
        sourceImageUrl: z.string().url().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const creditCost = calculateCreditCost(input.jobType, input.quality);

        if (user.credits < creditCost) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Insufficient credits. Need ${creditCost}, have ${user.credits}.` });
        }

        // Deduct credits upfront
        const newBalance = await updateUserCredits(user.id, -creditCost);
        await createCreditTransaction({
          userId: user.id,
          type: "spend",
          amount: creditCost,
          balanceAfter: newBalance,
          description: `${input.jobType} image job`,
          referenceType: "image_job",
        });

        // Create job record
        const job = await createImageJob({
          userId: user.id,
          jobType: input.jobType,
          prompt: input.prompt,
          negativePrompt: input.negativePrompt,
          style: input.style,
          aspectRatio: input.aspectRatio,
          quality: input.quality,
          sourceImageUrl: input.sourceImageUrl,
          isPublic: input.isPublic,
          creditCost,
          status: "pending",
        });

        // Update transaction with job reference
        await createCreditTransaction({
          userId: user.id,
          type: "spend",
          amount: 0,
          balanceAfter: newBalance,
          description: `Job #${job.id} created`,
          referenceId: String(job.id),
          referenceType: "image_job",
        }).catch(() => {});

        // Process asynchronously (non-blocking)
        processImageJob(job.id, user.id).catch(console.error);

        return { jobId: job.id, creditCost, creditsRemaining: newBalance };
      }),

    // Get job status
    status: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await getImageJobById(input.jobId);
        if (!job || job.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return job;
      }),

    // List user's images with pagination and filters
    list: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().max(50).default(20),
        search: z.string().optional(),
        jobType: z.string().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getUserImageJobs(ctx.user.id, input.page, input.limit, input.search, input.jobType, input.status);
      }),

    // Delete an image
    delete: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteImageJob(input.jobId, ctx.user.id);
        return { success: true };
      }),

    // Toggle public/private
    togglePublic: protectedProcedure
      .input(z.object({ jobId: z.number(), isPublic: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const job = await getImageJobById(input.jobId);
        if (!job || job.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await updateImageJob(input.jobId, { isPublic: input.isPublic });

        if (input.isPublic && job.status === "completed" && job.resultImageUrl) {
          // Add to gallery
          await createGalleryItem({
            jobId: input.jobId,
            userId: ctx.user.id,
            userName: ctx.user.name ?? "Anonymous",
            imageUrl: job.resultImageUrl,
            thumbnailUrl: job.thumbnailUrl ?? job.resultImageUrl,
            prompt: job.prompt,
            style: job.style ?? undefined,
            title: job.prompt.slice(0, 100),
          }).catch(() => {});
        }
        return { success: true };
      }),

    // Retry a failed job: refund original credits, create new job with same params
    retry: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const originalJob = await getImageJobById(input.jobId);

        if (!originalJob || originalJob.userId !== user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到此任務" });
        }
        if (originalJob.status !== "failed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "只能重試失敗的任務" });
        }

        // Enforce max 3 retries
        const MAX_RETRIES = 3;
        const currentRetryCount = originalJob.retryCount ?? 0;
        if (currentRetryCount >= MAX_RETRIES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `已達最大重試次數（${MAX_RETRIES} 次），請重新建立任務`,
          });
        }

        const creditCost = originalJob.creditCost;

        if (user.credits < creditCost) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `積分不足，需要 ${creditCost} 積分，目前剩餘 ${user.credits} 積分`,
          });
        }

        // Deduct credits for the retry
        const newBalance = await updateUserCredits(user.id, -creditCost);
        await createCreditTransaction({
          userId: user.id,
          type: "spend",
          amount: creditCost,
          balanceAfter: newBalance,
          description: `重試任務 #${originalJob.id}（第 ${currentRetryCount + 1} 次）`,
          referenceType: "image_job",
        });

        // Create a new job with the same parameters, incrementing retryCount
        const newJob = await createImageJob({
          userId: user.id,
          jobType: originalJob.jobType,
          prompt: originalJob.prompt,
          negativePrompt: originalJob.negativePrompt ?? undefined,
          style: originalJob.style ?? undefined,
          aspectRatio: originalJob.aspectRatio ?? "1:1",
          quality: originalJob.quality ?? "standard",
          sourceImageUrl: originalJob.sourceImageUrl ?? undefined,
          isPublic: originalJob.isPublic ?? false,
          creditCost,
          status: "pending",
          retryCount: currentRetryCount + 1,
        });

        // Process asynchronously
        processImageJob(newJob.id, user.id).catch(console.error);

        return {
          jobId: newJob.id,
          creditCost,
          creditsRemaining: newBalance,
          retryCount: currentRetryCount + 1,
          retriesLeft: MAX_RETRIES - (currentRetryCount + 1),
        };
      }),

    // Credit costs info
    creditCosts: publicProcedure.query(() => CREDIT_COSTS),
  }),

  // ─── Prompt Assistant ──────────────────────────────────────────────────────
  prompt: router({
    optimize: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(1000),
        style: z.string().optional(),
        jobType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const res = await invokeLLM({
          messages: [
            {
              role: "system" as const,
              content: `You are an expert AI image generation prompt engineer. Your task is to enhance and optimize image generation prompts to produce better, more detailed, and visually stunning results. 
              
              When given a prompt, you should:
              1. Add specific artistic details, lighting descriptions, and composition notes
              2. Include relevant technical photography/art terms
              3. Specify quality indicators like "highly detailed", "8k", "photorealistic" when appropriate
              4. Keep the core intent of the original prompt
              5. Return ONLY the optimized prompt, nothing else`,
            },
            {
              role: "user" as const,
              content: `Optimize this image generation prompt${input.style ? ` for ${input.style} style` : ""}:\n\n"${input.prompt}"`,
            },
          ],
        });
        const raw = res.choices?.[0]?.message?.content;
        const optimized = typeof raw === "string" ? raw.trim() : input.prompt;
        return { original: input.prompt, optimized };
      }),

    suggestions: protectedProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        const res = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are a creative AI art director. Generate 6 diverse, inspiring image generation prompts. Return as JSON array of strings." },
            { role: "user" as const, content: `Generate 6 creative image prompts${input.category ? ` for category: ${input.category}` : ""}. Return JSON array only.` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "prompts", strict: true, schema: { type: "object", properties: { prompts: { type: "array", items: { type: "string" } } }, required: ["prompts"], additionalProperties: false } } },
        });
        try {
          const raw = res.choices?.[0]?.message?.content;
          const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");
          return { prompts: parsed.prompts || [] };
        } catch {
          return { prompts: [] };
        }
      }),
  }),

  // ─── Credits ───────────────────────────────────────────────────────────────
  credits: router({
    balance: protectedProcedure.query(({ ctx }) => ({ credits: ctx.user.credits })),

    history: protectedProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().max(50).default(20) }))
      .query(async ({ ctx, input }) => getUserCreditHistory(ctx.user.id, input.page, input.limit)),

    packages: publicProcedure.query(() => getCreditPackages()),

    // Simulate recharge (in production, integrate with payment gateway)
    recharge: protectedProcedure
      .input(z.object({ packageId: z.number(), credits: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const newBalance = await updateUserCredits(ctx.user.id, input.credits);
        await createCreditTransaction({
          userId: ctx.user.id,
          type: "recharge",
          amount: input.credits,
          balanceAfter: newBalance,
          description: `Credit recharge - Package #${input.packageId}`,
          referenceId: String(input.packageId),
          referenceType: "credit_package",
        });
        return { success: true, newBalance };
      }),
  }),

  // ─── Gallery ───────────────────────────────────────────────────────────────
  gallery: router({
    list: publicProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().max(50).default(20), featured: z.boolean().default(false) }))
      .query(async ({ input }) => getGalleryItems(input.page, input.limit, input.featured)),

    like: protectedProcedure
      .input(z.object({ galleryItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await toggleGalleryLike(input.galleryItemId, ctx.user.id);
        return { liked };
      }),

    myLikes: protectedProcedure.query(async ({ ctx }) => {
      const ids = await getUserLikedIds(ctx.user.id);
      return { likedIds: ids };
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      const [stats, creditStats] = await Promise.all([getAdminStats(), getSystemCreditStats()]);
      return { ...stats, ...creditStats };
    }),

    users: adminProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().default(20), search: z.string().optional() }))
      .query(async ({ input }) => getAllUsers(input.page, input.limit, input.search)),

    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "premium", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    grantCredits: adminProcedure
      .input(z.object({ userId: z.number(), amount: z.number().min(1), reason: z.string() }))
      .mutation(async ({ input }) => {
        const newBalance = await updateUserCredits(input.userId, input.amount);
        await createCreditTransaction({
          userId: input.userId,
          type: "bonus",
          amount: input.amount,
          balanceAfter: newBalance,
          description: `Admin bonus: ${input.reason}`,
          referenceType: "admin_grant",
        });
        return { success: true, newBalance };
      }),

    packages: adminProcedure.query(() => getCreditPackages()),

    upsertPackage: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        credits: z.number().min(1),
        price: z.number().min(0),
        currency: z.string().default("USD"),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertCreditPackage(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
