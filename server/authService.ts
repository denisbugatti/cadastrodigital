/**
 * Custom Authentication Service
 * Handles login/register for staff users (email+password) and client users (CPF/CNPJ+password).
 * Uses bcrypt for password hashing and JWT for session tokens.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { revokedTokens } from "../drizzle/schema";
import { eq, lt } from "drizzle-orm";

// Lazy DB connection for token revocation checks
let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!_db) {
    const pool = mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool);
  }
  return _db;
}

/** Add a token to the revocation list */
export async function revokeToken(token: string, expiresAt: Date): Promise<void> {
  const db = getDb();
  await db.insert(revokedTokens).values({ token, expiresAt });
  // Cleanup old expired tokens (fire-and-forget)
  db.delete(revokedTokens).where(lt(revokedTokens.expiresAt, new Date())).catch(() => {});
}

/** Check if a token has been revoked */
async function isTokenRevoked(token: string): Promise<boolean> {
  const db = getDb();
  const rows = await db.select({ id: revokedTokens.id }).from(revokedTokens).where(eq(revokedTokens.token, token)).limit(1);
  return rows.length > 0;
}

const SALT_ROUNDS = 12;

// ─── Password Hashing ───

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Session Tokens ───

export type StaffSessionPayload = {
  type: "staff";
  staffUserId: number;
  email: string;
  role: string;
  name: string;
};

export type ClientSessionPayload = {
  type: "client";
  clientUserId: number;
  cpfCnpj: string;
  name: string;
};

export type SessionPayload = StaffSessionPayload | ClientSessionPayload;

function getSessionSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}

export async function createStaffSessionToken(user: {
  id: number;
  email: string;
  role: string;
  name: string;
}): Promise<string> {
  const secretKey = getSessionSecret();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);

  return new SignJWT({
    type: "staff",
    staffUserId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function createClientSessionToken(user: {
  id: number;
  cpfCnpj: string;
  name: string;
}): Promise<string> {
  const secretKey = getSessionSecret();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);

  return new SignJWT({
    type: "client",
    clientUserId: user.id,
    cpfCnpj: user.cpfCnpj,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    // Check if token has been revoked (e.g., after logout)
    const revoked = await isTokenRevoked(token);
    if (revoked) return null;

    const type = payload.type as string;

    if (type === "staff") {
      return {
        type: "staff",
        staffUserId: payload.staffUserId as number,
        email: payload.email as string,
        role: payload.role as string,
        name: payload.name as string,
      };
    }

    if (type === "client") {
      return {
        type: "client",
        clientUserId: payload.clientUserId as number,
        cpfCnpj: payload.cpfCnpj as string,
        name: payload.name as string,
      };
    }

    // Legacy Manus OAuth token — check for openId
    if (payload.openId) {
      return null; // Will be handled by the legacy flow
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Invite Token ───

export function generateInviteToken(): string {
  return nanoid(32);
}

// ─── CPF/CNPJ Validation ───

export function cleanCpfCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const clean = cleanCpfCnpj(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // All same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(clean[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = cleanCpfCnpj(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(clean[i]) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(clean[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(clean[i]) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(clean[13]) === digit2;
}

export function isValidCpfCnpj(value: string): boolean {
  const clean = cleanCpfCnpj(value);
  if (clean.length === 11) return isValidCpf(clean);
  if (clean.length === 14) return isValidCnpj(clean);
  return false;
}
