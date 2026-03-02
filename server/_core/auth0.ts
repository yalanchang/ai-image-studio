/**
 * Auth0 JWT verification middleware for Express + tRPC
 *
 * Verifies the Bearer token from the Authorization header using Auth0's
 * JWKS endpoint, then resolves the user from the database (creating one
 * on first login).
 */
import { expressjwt, GetVerificationKey } from "express-jwt";
import jwksRsa from "jwks-rsa";
import type { Request } from "express";
import * as db from "../db";

const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN ?? "";
// NOTE: We intentionally do NOT use VITE_AUTH0_AUDIENCE here.
// The Manus platform injects a value that is not a valid Auth0 API identifier.
// Without a custom audience, Auth0 issues opaque tokens for /userinfo.
const AUTH0_AUDIENCE = undefined;

/**
 * Express middleware that validates Auth0 JWT tokens.
 * Attaches decoded payload to req.auth if valid; skips silently if no token.
 */
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: AUTH0_AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  credentialsRequired: false, // allow public procedures to pass through
});

/**
 * Resolve the Manus DB user from an Auth0 JWT payload attached to the request.
 * Creates the user record on first login (upsert).
 */
export async function resolveAuth0User(req: Request) {
  // express-jwt attaches decoded payload to req.auth
  const auth = (req as any).auth as Record<string, unknown> | undefined;
  if (!auth?.sub) return null;

  const sub = auth.sub as string; // e.g. "google-oauth2|123456" or "auth0|abc"
  const email = (auth.email ?? auth["https://instant.app/email"] ?? null) as string | null;
  const name = (auth.name ?? auth["https://instant.app/name"] ?? null) as string | null;
  const picture = (auth.picture ?? null) as string | null;

  // Derive login method from the sub prefix
  const loginMethod = sub.startsWith("google-oauth2|")
    ? "google"
    : sub.startsWith("github|")
    ? "github"
    : sub.startsWith("auth0|")
    ? "email"
    : "auth0";

  // Upsert user on every request to keep lastSignedIn fresh
  await db.upsertUser({
    openId: sub,
    name: name ?? undefined,
    email: email ?? undefined,
    loginMethod,
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(sub);
  return user ?? null;
}
