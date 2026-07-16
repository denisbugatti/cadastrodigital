#!/usr/bin/env node
/* ============================================================
   VITACON — Preview de UMA página do deck em PNG (rápido).
   Uso:  node deck/preview.mjs <slug> <numeroDaPagina>
   Saída: deck/empreendimentos/<slug>/._preview.png
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECK = __dirname;

const slug = process.argv[2];
const page = parseInt(process.argv[3] || "1", 10);
if (!slug) { console.error("uso: node deck/preview.mjs <slug> <pagina>"); process.exit(1); }

const projDir = join(DECK, "empreendimentos", slug);
const htmlPath = join(projDir, `${slug}.html`);
if (!existsSync(htmlPath)) { console.error("gere o editável antes:", htmlPath); process.exit(1); }

const src = readFileSync(htmlPath, "utf8");
// separa os blocos por marcador de página
const marker = /<!--\s*═+\s*PÁGINA\s+(\d+)[^>]*-->/g;
const idx = [];
let m;
while ((m = marker.exec(src))) idx.push({ n: parseInt(m[1], 10), at: m.index });
if (!idx.length) { console.error("nenhum marcador de página encontrado"); process.exit(1); }
const found = idx.findIndex((x) => x.n === page);
if (found < 0) { console.error("página", page, "não existe (1.." + idx[idx.length - 1].n + ")"); process.exit(1); }
const start = idx[found].at;
const end = found + 1 < idx.length ? idx[found + 1].at : src.indexOf("</body>");
const bloco = src.slice(start, end);

const doc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="../../template/styles.css">
<style>html,body{margin:0;background:#000}</style></head><body>${bloco}</body></html>`;
const tmpHtml = join(projDir, "._preview.html");
const outPng = join(projDir, "._preview.png");
writeFileSync(tmpHtml, doc);

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  try { const o = execSync(`find /opt/pw-browsers -maxdepth 3 -type f -name chrome 2>/dev/null | head -1`).toString().trim(); if (o) return o; } catch {}
  for (const c of ["google-chrome", "chromium", "chromium-browser"]) { try { const p = execSync(`command -v ${c}`).toString().trim(); if (p) return p; } catch {} }
  return null;
}
const chrome = findChrome();
if (!chrome) { console.error("Chromium não encontrado."); process.exit(1); }

const r = spawnSync(chrome, [
  "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1", "--window-size=1920,1080",
  "--default-background-color=000000ff",
  `--screenshot=${outPng}`, pathToFileURL(tmpHtml).href,
], { encoding: "utf8" });
if (!existsSync(outPng)) { console.error("falha no screenshot:\n", r.stderr); process.exit(1); }
console.log("✅ preview:", outPng, "(página " + page + ")");
