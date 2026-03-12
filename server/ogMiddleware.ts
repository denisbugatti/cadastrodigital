/**
 * Open Graph middleware — serves dynamic OG meta tags for social media crawlers.
 * When WhatsApp, Facebook, Twitter, etc. fetch a form URL (/:slug),
 * this middleware returns a minimal HTML page with the correct OG tags
 * so the link preview shows the form title, description, and image.
 *
 * Regular browsers get the normal SPA (index.html) as usual.
 */

import { type Request, type Response, type NextFunction } from "express";
import { getFormBySlug, getSiteSettings } from "./db";

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
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/app-icon-3d-512_2f82cd93.png";
const DEFAULT_OG_TITLE = "Cadastro Digital | One Innovation";
const DEFAULT_OG_DESCRIPTION = "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.";
const BASE_URL = "https://one.cadastrodigital.com.br";

// Cache site settings to avoid DB hits on every crawler request
let _cachedSiteSettings: any = null;
let _settingsCacheExpiry = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedSiteSettings() {
  const now = Date.now();
  if (_cachedSiteSettings && now < _settingsCacheExpiry) {
    return _cachedSiteSettings;
  }
  try {
    const settings = await getSiteSettings();
    if (settings) {
      _cachedSiteSettings = settings;
      _settingsCacheExpiry = now + SETTINGS_CACHE_TTL;
    }
    return settings;
  } catch {
    return _cachedSiteSettings; // Return stale cache on error
  }
}

export function ogMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept GET requests
    if (req.method !== "GET") return next();

    // Only intercept crawler requests
    const ua = req.headers["user-agent"];
    if (!isCrawler(ua)) return next();

    const path = req.path;

    // Handle homepage OG tags for crawlers
    if (path === "/" || path === "") {
      try {
        const settings = await getCachedSiteSettings();
        const title = escapeHtml(settings?.ogTitle || DEFAULT_OG_TITLE);
        const description = escapeHtml(settings?.ogDescription || DEFAULT_OG_DESCRIPTION);
        const image = escapeHtml(settings?.ogImage || DEFAULT_OG_IMAGE);
        const url = escapeHtml(settings?.ogUrl || BASE_URL);

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Cadastro Digital" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Redirecionando para <a href="${url}">${title}</a>...</p>
</body>
</html>`;
        return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
      } catch {
        return next();
      }
    }

    // Extract potential slug from path (must be /:slug pattern — single segment, no dots)
    const slugMatch = path.match(/^\/([a-z0-9][a-z0-9_-]{0,60})$/i);
    if (!slugMatch) return next();

    const slug = slugMatch[1];

    // Skip known app routes
    const appRoutes = [
      "login", "dashboard", "editor", "responses", "equipe",
      "configuracoes", "validar", "aceitar-convite", "404",
      "portal", "cadastro-cliente",
      "api", "assets", "sw.js", "manifest.json", "robots.txt",
    ];
    if (appRoutes.includes(slug.toLowerCase())) return next();

    try {
      const form = await getFormBySlug(slug);
      if (!form) return next();

      // Extract OG fields from design, with fallbacks to form title/description
      let ogTitle = form.title || "Cadastro Digital";
      let ogDescription = form.description || "Preencha o formulário de forma segura e digital.";
      let ogImage = DEFAULT_OG_IMAGE;

      try {
        if (form.design && typeof form.design === "object") {
          const design = form.design as any;
          // Prefer explicit OG fields set in the editor's "Compartilhamento" section
          if (design.ogTitle) ogTitle = design.ogTitle;
          if (design.ogDescription) ogDescription = design.ogDescription;
          // Image priority: ogImage > logoUrl > default
          if (design.ogImage) {
            ogImage = design.ogImage;
          } else if (design.logoUrl) {
            ogImage = design.logoUrl;
          }
        }
      } catch {
        // ignore parse errors
      }

      const title = escapeHtml(ogTitle);
      const description = escapeHtml(ogDescription);

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
