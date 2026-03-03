/**
 * Publish all Resend templates so they become active
 * Run with: node server/publishResendTemplates.mjs
 */
import "dotenv/config";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const templateIds = [
  { name: "Convite Staff", id: "41d689fb-2ed7-469a-9e3d-6204085bd5bc" },
  { name: "Cadastro Pendente", id: "1d4c3ca1-026d-42ef-83c7-3b37cedcb802" },
  { name: "Cadastro Aprovado", id: "bd17dc65-aa61-4ba9-8444-4f9baa841c2e" },
  { name: "Revisão Necessária", id: "9a49a11e-5022-4e3d-bf2b-cdeb80e13ac9" },
  { name: "Cadência Abandono V1", id: "dd26aab4-fdf6-4d3f-97f3-5915686d4a67" },
  { name: "Cadência Abandono V2", id: "9cb9b98c-7330-4280-9f15-258cbaaeca48" },
  { name: "Cadência Abandono V3", id: "0d780f6f-08cf-45d6-9f7c-bf8afeb58358" },
  { name: "Cadência Reprovação V1", id: "73360690-8866-4c88-9a65-b8dc053c1ef1" },
  { name: "Cadência Reprovação V2", id: "7771cbf0-4b04-4254-824a-21ac3440a1ed" },
  { name: "Cadência Reprovação V3", id: "ac1d6bb6-499e-4ab1-8794-62518cc7e0bd" },
  { name: "Notificação Corretor", id: "164cfd9d-0780-4c4d-9841-59f2693d0552" },
];

async function publishAll() {
  console.log("📤 Publishing all templates...\n");
  let success = 0;
  let failed = 0;

  for (const t of templateIds) {
    try {
      process.stdout.write(`  ${t.name}...`);
      const { data, error } = await resend.templates.publish(t.id);
      if (error) {
        console.log(` ❌ ${JSON.stringify(error)}`);
        failed++;
      } else {
        console.log(` ✅`);
        success++;
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(` ❌ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ ${success} published, ❌ ${failed} failed`);
}

publishAll().catch(console.error);
