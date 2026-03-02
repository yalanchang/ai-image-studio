import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { resolveAuth0User } from "./auth0";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 1. Try Auth0 JWT first (Bearer token in Authorization header)
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      user = await resolveAuth0User(opts.req);
    }

    // 2. Fall back to Manus session cookie for backward compatibility
    if (!user) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
