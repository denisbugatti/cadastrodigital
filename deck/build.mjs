#!/usr/bin/env node
/* ============================================================
   VITACON — Gerador de deck de vendas (HTML → PDF 16:9)
   Uso:  node deck/build.mjs <slug>       (ex.: on-paulista)
   Saída: deck/empreendimentos/<slug>/<slug>.pdf
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { spawnSync, execSync } from "node:child_process";
import { renderSlide } from "./template/components.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECK = __dirname;
const TEMPLATE = join(DECK, "template");
const FIXOS = join(DECK, "assets-fixos");

const slug = process.argv[2];
if (!slug) { console.error("uso: node deck/build.mjs <slug>"); process.exit(1); }

const projDir = join(DECK, "empreendimentos", slug);
const dadosPath = join(projDir, "dados.json");
if (!existsSync(dadosPath)) { console.error("não achei", dadosPath); process.exit(1); }

const dados = JSON.parse(readFileSync(dadosPath, "utf8"));
const projeto = dados.projeto || {};
const slides = dados.slides || [];

// um slide é numerado (mostra o chrome com rodapé) quando é um slide "de conteúdo"
function numera(s) {
  if (s.tipo === "capa" || s.tipo === "juridico") return false;
  if (s.tipo === "imagem") return !!s.chrome;
  if (s.tipo === "divisor") return s.fundo !== "azul" && s.chrome !== false;
  return true;
}
const total = dados.numeracaoTotal || slides.filter(numera).length;

const fileUrl = (p) => pathToFileURL(p).href;
const foto = (name) => fileUrl(join(projDir, "fotos", name));
const fixo = (name) => fileUrl(join(FIXOS, name));
const wm = fixo("vitacon-wordmark.png");

let pageNum = 0;
const bodies = slides.map((s) => {
  if (numera(s)) pageNum += 1;
  const ctx = { projeto, pageNum, total, foto, fixo, wm };
  return renderSlide(s, ctx);
}).join("\n");

const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<link rel="stylesheet" href="${fileUrl(join(TEMPLATE, "styles.css"))}">
<title>${projeto.nome || slug} — Vitacon</title>
</head><body>
${bodies}
</body></html>`;

const htmlPath = join(projDir, "_deck.html");
writeFileSync(htmlPath, html);
console.log("HTML:", htmlPath, `(${slides.length} slides)`);

// localizar o binário do Chromium
function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const roots = ["/opt/pw-browsers"];
  for (const r of roots) {
    try {
      const out = execSync(`find ${r} -maxdepth 3 -type f -name chrome 2>/dev/null | head -1`).toString().trim();
      if (out) return out;
    } catch {}
  }
  for (const c of ["google-chrome", "chromium", "chromium-browser"]) {
    try { const p = execSync(`command -v ${c}`).toString().trim(); if (p) return p; } catch {}
  }
  return null;
}
const chrome = findChrome();
if (!chrome) { console.error("Chromium não encontrado. Defina CHROME_BIN."); process.exit(1); }

const pdfPath = join(projDir, `${slug}.pdf`);
const args = [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=12000",
  `--print-to-pdf=${pdfPath}`, fileUrl(htmlPath),
];
console.log("Chromium:", chrome);
const r = spawnSync(chrome, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
if (r.status !== 0 && !existsSync(pdfPath)) {
  console.error("Falha ao gerar PDF:\n", r.stderr); process.exit(1);
}
console.log("✅ PDF gerado:", pdfPath);
