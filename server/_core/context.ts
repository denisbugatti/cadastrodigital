import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySessionToken } from "../authService";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import { ENV } from "./env";

/**
 * Extended context type that includes custom auth info.
 * staffUser is set when a staff member is logged in via custom auth.
 */
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Custom auth session info (staff or client) */
  customSession?: {
    type: "staff";
    staffUserId: number;
    email: string;
    role: string;
    name: string;
  } | {
    type: "client";
    clientUserId: number;
    cpfCnpj: string;
    name: string;
  } | null;
};

/**
 * Parse cookies from request header.
 */
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  const cookies = new Map<string, string>();
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...rest] = cookie.trim().split("=");
    if (key) cookies.set(key.trim(), rest.join("=").trim());
  });
  return cookies;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let customSession: TrpcContext["customSession"] = null;

  // 1. Try Manus OAuth first (legacy)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // 2. If no Manus OAuth user, try custom auth JWT
  if (!user) {
    try {
      const cookies = parseCookies(opts.req.headers.cookie);
      const token = cookies.get(COOKIE_NAME);
      if (token) {
        const session = await verifySessionToken(token);
        if (session) {
          customSession = session;

          // For staff users, map them to the owner user in the users table
          // so they can access forms and other data that belongs to the owner.
          // All staff members share access to the same forms.
          if (session.type === "staff") {
            const ownerOpenId = ENV.ownerOpenId;
            if (ownerOpenId) {
              const ownerUser = await db.getUserByOpenId(ownerOpenId);
              if (ownerUser) {
                user = ownerUser;
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("[Auth] Custom auth check failed:", err?.message?.substring(0, 80));
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    customSession,
  };
}
