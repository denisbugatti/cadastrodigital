/**
 * Open Graph middleware — serves dynamic OG meta tags for social media crawlers.
 * When WhatsApp, Facebook, Twitter, etc. fetch a form URL (/:slug),
 * this middleware returns a minimal HTML page with the correct OG tags
 * so the link preview shows the form title, description, and image.
 *
 * Regular browsers get the normal SPA (index.html) as usual.
 */

import { type Request, type Response, type NextFunction } from "express";
import { getFormBySlug } from "./db";

// User-agent patterns for known social media crawlers
const CRAWLER_UA_PATTERNS = [
  /facebookexternalhit/i,
  /Facebot/i,
  /WhatsApp/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /TelegramBot/i,
  /Discordbot/i,
  /Googlebot/i,
  /bingbot/i,
  /Applebot/i,
  /Pinterest/i,
  /vkShare/i,
  /Viber/i,
  /SkypeUriPreview/i,
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/formflow-icon-512_f2d6e9c0.png";
const BASE_URL = "https://one.cadastrodigital.com.br";

export function ogMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept GET requests
    if (req.method !== "GET") return next();

    // Only intercept crawler requests
    const ua = req.headers["user-agent"];
    if (!isCrawler(ua)) return next();

    // Extract potential slug from path (must be /:slug pattern — single segment, no dots)
    const path = req.path;
    const slugMatch = path.match(/^\/([a-z0-9][a-z0-9_-]{0,60})$/i);
    if (!slugMatch) return next();

    const slug = slugMatch[1];

    // Skip known app routes
    const appRoutes = [
      "login", "dashboard", "editor", "responses", "equipe",
      "configuracoes", "validar", "aceitar-convite", "404",
      "api", "assets", "sw.js", "manifest.json", "robots.txt",
    ];
    if (appRoutes.includes(slug.toLowerCase())) return next();

    try {
      const form = await getFormBySlug(slug);
      if (!form) return next();

      const title = escapeHtml(form.title || "Cadastro Digital");
      const description = escapeHtml(
        form.description ||
        "Preencha o formulário de forma segura e digital."
      );
      // Use form's design cover image if available, otherwise default
      let ogImage = DEFAULT_OG_IMAGE;
      try {
        if (form.design && typeof form.design === "object") {
          const design = form.design as any;
          if (design.coverImage) {
            ogImage = design.coverImage;
          } else if (design.logo) {
            ogImage = design.logo;
          }
        }
      } catch {
        // ignore parse errors
      }

      const url = `${BASE_URL}/${slug}`;

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Cadastro Digital</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="Cadastro Digital" />
  <meta property="og:locale" content="pt_BR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <!-- Redirect real browsers to the SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(url)}">${title}</a>...</p>
</body>
</html>`;

      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
    } catch (err) {
      // On any error, fall through to the SPA
      console.warn("[OG Middleware] Error:", (err as Error).message);
      return next();
    }
  };
}
