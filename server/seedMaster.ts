/**
 * Seed the master user and default permissions.
 * Called at server startup to ensure the master account exists.
 */

import * as staffDb from "./staffDb";
import { hashPassword } from "./authService";

const MASTER_EMAIL = "contato@denisbugatti.com.br";
const MASTER_PASSWORD = "WdZQ7eQJXJ";
const MASTER_NAME = "Denis Bugatti";

export async function seedMasterUser(): Promise<void> {
  try {
    // Check if master already exists
    const existing = await staffDb.getStaffUserByEmail(MASTER_EMAIL);
    if (existing) {
      console.log("[Seed] Master user already exists");
      return;
    }

    // Create master user
    const passwordHash = await hashPassword(MASTER_PASSWORD);
    await staffDb.createStaffUser({
      email: MASTER_EMAIL.toLowerCase(),
      passwordHash,
      name: MASTER_NAME,
      role: "master",
      active: true,
    });

    console.log(`[Seed] Master user created: ${MASTER_EMAIL}`);
  } catch (err: any) {
    console.error("[Seed] Failed to seed master user:", err?.message?.substring(0, 100));
  }
}

export async function seedDefaultPermissions(): Promise<void> {
  try {
    await staffDb.seedDefaultPermissions();
    console.log("[Seed] Default permissions seeded");
  } catch (err: any) {
    console.error("[Seed] Failed to seed permissions:", err?.message?.substring(0, 100));
  }
}

export async function runSeeds(): Promise<void> {
  await seedMasterUser();
  await seedDefaultPermissions();
}
