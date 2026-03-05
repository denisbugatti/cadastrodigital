/**
 * Owner user resolution with multi-layer fallback.
 * Extracted to its own file to avoid circular dependency issues
 * (trpc.ts -> routers.ts -> trpc.ts).
 */
import * as db from "./db";
import { ENV } from "./_core/env";

/**
 * In-memory cache for the owner user.
 * Once resolved, we never need to query the DB again for auth.
 * This eliminates the #1 cause of intermittent failures:
 * every single request was hitting the DB just to resolve the owner.
 */
let _cachedOwnerUser: any = null;
let _ownerCacheExpiry = 0;
let _cachedOwnerName: string | undefined = undefined;
const OWNER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased for stability)

/**
 * Build a synthetic owner user object.
 * Used as ultimate fallback when DB is unreachable.
 */
function buildSyntheticOwner(ownerOpenId: string): any {
  return {
    id: 1,
    openId: ownerOpenId,
    name: process.env.OWNER_NAME ?? "Owner",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

/**
 * Get or create the owner user with multiple fallback layers:
 * 1. In-memory cache (fastest)
 * 2. Database lookup with retry
 * 3. Stale cache (if available)
 * 4. Synthetic owner (guaranteed to work)
 *
 * This function NEVER throws — it always returns a valid owner user.
 */
export async function getOrCreateOwnerUser(): Promise<any> {
  const now = Date.now();
  const currentOwnerName = process.env.OWNER_NAME;

  // Invalidate cache if OWNER_NAME env var changed (e.g. after restart with new value)
  if (_cachedOwnerUser && _cachedOwnerName !== currentOwnerName) {
    console.log(`[ownerFallback] OWNER_NAME changed from "${_cachedOwnerName}" to "${currentOwnerName}", invalidating cache`);
    _cachedOwnerUser = null;
    _ownerCacheExpiry = 0;
  }

  // Layer 1: Return cached owner if still valid
  if (_cachedOwnerUser && now < _ownerCacheExpiry) {
    return _cachedOwnerUser;
  }

  const ownerOpenId = ENV.ownerOpenId;
  if (!ownerOpenId) {
    console.error("[ownerFallback] OWNER_OPEN_ID is not set!");
    // Even without ownerOpenId, return a synthetic user so the app doesn't crash
    const synthetic = buildSyntheticOwner("unknown");
    _cachedOwnerUser = synthetic;
    _ownerCacheExpiry = now + 30000;
    return synthetic;
  }

  // Layer 2: Try database lookup with retries
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let ownerUser = await db.getUserByOpenId(ownerOpenId);
      if (!ownerUser) {
        // Auto-create owner user
        console.log("[ownerFallback] Owner not found in DB, creating...");
        await db.upsertUser({
          openId: ownerOpenId,
          name: currentOwnerName ?? "Owner",
          role: "admin",
          lastSignedIn: new Date(),
        });
        ownerUser = await db.getUserByOpenId(ownerOpenId);
      } else if (currentOwnerName && ownerUser.name !== currentOwnerName) {
        // Sync name from OWNER_NAME env var if it changed
        console.log(`[ownerFallback] Syncing owner name from "${ownerUser.name}" to "${currentOwnerName}"`);
        await db.upsertUser({
          openId: ownerOpenId,
          name: currentOwnerName,
          lastSignedIn: new Date(),
        });
        ownerUser = await db.getUserByOpenId(ownerOpenId);
      }

      if (ownerUser) {
        _cachedOwnerUser = ownerUser;
        _cachedOwnerName = currentOwnerName;
        _ownerCacheExpiry = now + OWNER_CACHE_TTL;
        return ownerUser;
      }
    } catch (err: any) {
      const errMsg = err?.message?.substring(0, 120) ?? "unknown";
      console.warn(`[ownerFallback] DB error attempt ${attempt + 1}/3: ${errMsg}`);

      // Layer 3: If we have a stale cache, use it
      if (_cachedOwnerUser) {
        console.log("[ownerFallback] Using stale cached owner");
        _ownerCacheExpiry = now + 120000; // Extend stale cache for 2 min
        return _cachedOwnerUser;
      }

      if (attempt < 2) {
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 300;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
    }
  }

  // Layer 4: Synthetic owner as ultimate fallback (NEVER fails)
  console.warn("[ownerFallback] All DB attempts failed. Using synthetic owner.");
  const synthetic = buildSyntheticOwner(ownerOpenId);
  _cachedOwnerUser = synthetic;
  _ownerCacheExpiry = now + 30000; // Short TTL so we retry DB soon
  return synthetic;
}
