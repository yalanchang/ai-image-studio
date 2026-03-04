import { Server as SocketIOServer } from "socket.io";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { createImageJob, updateImageJob, getImageJobById, updateUserCredits, createCreditTransaction, createGalleryItem, getUserById } from "./db";
import { nanoid } from "nanoid";

export let io: SocketIOServer | null = null;

const MAX_CONCURRENT = 5;
let activeJobs = 0;
const pendingQueue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeJobs < MAX_CONCURRENT) {
      activeJobs++;
      resolve();
    } else {
      pendingQueue.push(() => { activeJobs++; resolve(); });
    }
  });
}

function releaseSlot() {
  activeJobs = Math.max(0, activeJobs - 1);
  const next = pendingQueue.shift();
  if (next) next();
}

export function initSocketIO(server: any) {
  io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket: any) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) socket.join(`user:${userId}`);
    socket.on("disconnect", () => {});
  });

  return io;
}

export function emitJobUpdate(userId: number, jobId: number, data: Record<string, unknown>) {
  if (io) io.to(`user:${userId}`).emit("job:update", { jobId, ...data });
}

export const CREDIT_COSTS: Record<string, number> = {
  generate: 10,
  edit: 15,
  style_transfer: 12,
  background_replace: 15,
  object_remove: 20,
  upscale: 8,
};

const QUALITY_MULTIPLIER: Record<string, number> = {
  standard: 1,
  hd: 2,
  ultra: 3,
};

export function calculateCreditCost(jobType: string, quality: string): number {
  const base = CREDIT_COSTS[jobType] ?? 10;
  const mult = QUALITY_MULTIPLIER[quality] ?? 1;
  return base * mult;
}

export async function processImageJob(jobId: number, userId: number) {
  await acquireSlot();
  try {
    await updateImageJob(jobId, { status: "processing" });
    emitJobUpdate(userId, jobId, { status: "processing", progress: 10, message: "Starting AI processing..." });

    const job = await getImageJobById(jobId);
    if (!job) throw new Error("Job not found");

    let finalPrompt = job.optimizedPrompt || job.prompt;
    if (!job.optimizedPrompt) {
      emitJobUpdate(userId, jobId, { status: "processing", progress: 20, message: "Optimizing prompt..." });
      try {
        const llmRes = await invokeLLM({
          messages: [
            {
              role: "system" as const,
              content: "You are an expert at writing prompts for AI image generation. Enhance the given prompt to be more detailed, vivid, and effective. Return only the enhanced prompt, no explanations.",
            },
            { role: "user" as const, content: `Enhance this image generation prompt: "${job.prompt}"` },
          ],
        });
        const rawContent = llmRes.choices?.[0]?.message?.content;
        finalPrompt = (typeof rawContent === "string" ? rawContent : null) || job.prompt;
        await updateImageJob(jobId, { optimizedPrompt: finalPrompt });
      } catch {
        finalPrompt = job.prompt;
      }
    }

    emitJobUpdate(userId, jobId, { status: "processing", progress: 40, message: "Generating image with AI..." });

    let imageUrl: string;
    if (job.jobType === "generate") {
      const stylePrefix = job.style ? `${job.style} style, ` : "";
      const genResult = await generateImage({ prompt: `${stylePrefix}${finalPrompt}` });
      imageUrl = genResult.url ?? "";
    } else {
      const editPromptMap: Record<string, string> = {
        edit: finalPrompt,
        style_transfer: `Apply ${job.style || "artistic"} style transfer: ${finalPrompt}`,
        background_replace: `Replace the background with: ${finalPrompt}`,
        object_remove: `Remove the following from the image: ${finalPrompt}`,
        upscale: `Enhance and upscale the image quality: ${finalPrompt}`,
      };
      const editPrompt = editPromptMap[job.jobType] || finalPrompt;
      const originalImages = job.sourceImageUrl
        ? [{ url: job.sourceImageUrl, mimeType: "image/jpeg" as const }]
        : undefined;
      const editResult = await generateImage({ prompt: editPrompt, originalImages });
      imageUrl = editResult.url ?? "";
    }

    emitJobUpdate(userId, jobId, { status: "processing", progress: 75, message: "Saving image to storage..." });

    const imageRes = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const fileKey = `generated/${userId}/${jobId}-${nanoid(8)}.png`;
    const { url: s3Url } = await storagePut(fileKey, imageBuffer, "image/png");

    emitJobUpdate(userId, jobId, { status: "processing", progress: 90, message: "Finalizing..." });

    await updateImageJob(jobId, {
      status: "completed",
      resultImageUrl: s3Url,
      resultImageKey: fileKey,
      thumbnailUrl: s3Url,
      completedAt: new Date(),
    });

    const user = await getUserById(userId);
    if (user) {
      const db = (await import("./db")).getDb();
      const { users } = await import("../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      const dbInst = await db;
      if (dbInst) {
        await dbInst.update(users).set({ totalGenerated: sql`totalGenerated + 1` }).where(eq(users.id, userId));
      }
    }

    emitJobUpdate(userId, jobId, {
      status: "completed",
      progress: 100,
      message: "Image generated successfully!",
      resultImageUrl: s3Url,
    });

    if (job.isPublic && user) {
      await createGalleryItem({
        jobId,
        userId,
        userName: user.name ?? "Anonymous",
        userAvatar: user.avatar ?? undefined,
        title: job.prompt.slice(0, 100),
        prompt: job.prompt,
        style: job.style || null,
        imageUrl: s3Url,
        thumbnailUrl: s3Url,
      });
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown error";
    await updateImageJob(jobId, { status: "failed", errorMessage: errorMsg });
    emitJobUpdate(userId, jobId, { status: "failed", progress: 0, message: errorMsg });

    const job = await getImageJobById(jobId);
    if (job && job.creditCost > 0) {
      const newBalance = await updateUserCredits(userId, job.creditCost);
      await createCreditTransaction({
        userId,
        type: "refund",
        amount: job.creditCost,
        balanceAfter: newBalance,
        description: `Refund for failed job #${jobId}`,
        referenceId: String(jobId),
        referenceType: "image_job",
      });
    }
  } finally {
    releaseSlot();
  }
}
