#!/usr/bin/env node
/* ============================================================
   VITACON — Converte um HTML do deck em PDF 16:9 (Chromium headless).
   Uso:  node deck/html2pdf.mjs <slug>            (usa <slug>/<slug>.html)
         node deck/html2pdf.mjs caminho/arquivo.html
   ============================================================ */
import { existsSync as exists } from "node:fs";
import { spawnSync, execSync as run } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECK = __dirname;

const arg = process.argv[2];
if (!arg) { console.error("uso: node deck/html2pdf.mjs <slug | arquivo.html>"); process.exit(1); }

let htmlPath;
if (arg.endsWith(".html")) htmlPath = resolve(arg);
else htmlPath = join(DECK, "empreendimentos", arg, `${arg}.html`);
if (!exists(htmlPath)) { console.error("não achei o HTML:", htmlPath); process.exit(1); }

const pdfPath = htmlPath.replace(/\.html$/, ".pdf");

function findChrome() {
  if (process.env.CHROME_BIN && exists(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  try {
    const out = run(`find /opt/pw-browsers -maxdepth 3 -type f -name chrome 2>/dev/null | head -1`).toString().trim();
    if (out) return out;
  } catch {}
  for (const c of ["google-chrome", "chromium", "chromium-browser"]) {
    try { const p = run(`command -v ${c}`).toString().trim(); if (p) return p; } catch {}
  }
  return null;
}
const chrome = findChrome();
if (!chrome) { console.error("Chromium não encontrado. Defina CHROME_BIN."); process.exit(1); }

const args = [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=12000",
  `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href,
];
const r = spawnSync(chrome, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
if (r.status !== 0 && !exists(pdfPath)) { console.error("Falha ao gerar PDF:\n", r.stderr); process.exit(1); }
console.log("✅ PDF:", pdfPath);
