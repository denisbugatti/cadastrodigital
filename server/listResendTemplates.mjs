/**
 * List all Resend templates and their IDs
 */
import "dotenv/config";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function listTemplates() {
  try {
    const { data, error } = await resend.templates.list();
    if (error) {
      console.error("Error:", JSON.stringify(error));
      return;
    }

    console.log(`Found ${data.data.length} templates:\n`);
    for (const t of data.data) {
      console.log(`  Name: ${t.name}`);
      console.log(`  ID: ${t.id}`);
      console.log(`  Created: ${t.created_at}`);
      console.log("");
    }

    console.log("\n--- ENV VARS ---\n");
    for (const t of data.data) {
      const envKey = t.name
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, "_")
        .toUpperCase();
      console.log(`RESEND_TPL_${envKey}=${t.id}`);
    }
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

listTemplates();
