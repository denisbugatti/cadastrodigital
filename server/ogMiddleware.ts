/**
 * Open Graph middleware — serves dynamic OG meta tags for social media crawlers.
 * When WhatsApp, Facebook, Twitter, etc. fetch a form URL (/:slug) or a brand
 * subdomain root, this returns a minimal HTML page with the correct OG tags so the
 * link preview shows the right brand/form (title, description, image).
 *
 * Brand-aware: the meta is resolved from the request Host (one./vitacon.) so the
 * Vitacon subdomain never shows One Innovation branding and vice-versa.
 *
 * Regular browsers get the normal SPA (index.html) as usual.
 */

import { type Request, type Response, type NextFunction } from "express";
import { getFormBySlug, getSiteSettings, getBrandDefaultForm } from "./db";
import { brandFromHost, BRANDS, DEFAULT_SITE_URL } from "../shared/brands";

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

/**
 * Make a stored asset URL safe to embed in a meta tag: encodes raw spaces and
 * other unsafe characters (e.g. "og imagem.jpg" -> "og%20imagem.jpg") without
 * double-encoding already-encoded URLs. Crawlers like WhatsApp/Facebook reject
 * URLs with raw spaces and silently drop the preview image.
 */
function encodeAssetUrl(url: string): string {
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url.replace(/ /g, "%20");
  }
}

const DEFAULT_OG_TITLE = "Cadastro Digital | One Innovation";
const DEFAULT_OG_DESCRIPTION = "Empreendimentos inovadores nas melhores localizações de São Paulo com a máxima qualidade e rigorosa pontualidade.";
const BASE_URL = DEFAULT_SITE_URL;

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

/** Only the explicitly configured OG image — no default/brand fallback (blank if unset). */
function ogImageFromForm(form: any): string {
  const design = form?.design && typeof form.design === "object" ? form.design : {};
  return design.ogImage ? String(design.ogImage) : "";
}

/** Render the crawler HTML page with the given OG fields. Image tags are omitted when no image is configured. */
function renderOgHtml(opts: { title: string; description: string; image: string; url: string }): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const url = escapeHtml(opts.url);
  const hasImage = !!(opts.image && opts.image.trim());
  const image = hasImage ? escapeHtml(encodeAssetUrl(opts.image)) : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
${hasImage ? `  <meta property="og:image" content="${image}" />\n` : ""}  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Cadastro Digital" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:ttl" content="600" />
  <meta name="twitter:card" content="${hasImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
${hasImage ? `  <meta name="twitter:image" content="${image}" />\n` : ""}  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Redirecionando para <a href="${url}">${title}</a>...</p>
</body>
</html>`;
}

export function ogMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept GET requests
    if (req.method !== "GET") return next();

    // Only intercept crawler requests
    const ua = req.headers["user-agent"];
    if (!isCrawler(ua)) return next();

    const path = req.path;
    // Resolve the brand from the request host (one. / vitacon.); null on apex/unknown
    const host = (req.headers.host || "").toLowerCase().split(":")[0];
    const hostBrand = brandFromHost(host);
    const baseUrl = hostBrand ? `https://${BRANDS[hostBrand].host}` : BASE_URL;

    // Handle homepage OG tags for crawlers
    if (path === "/" || path === "") {
      try {
        // Brand subdomain root → use that brand's default form branding
        if (hostBrand) {
          const def = await getBrandDefaultForm(hostBrand);
          if (def) {
            const design = (def.design && typeof def.design === "object" ? def.design : {}) as any;
            return res
              .status(200)
              .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, max-age=0, must-revalidate" })
              .end(renderOgHtml({
                title: design.ogTitle || def.title || `${BRANDS[hostBrand].label} | Cadastro Digital`,
                description: design.ogDescription || def.description || BRANDS[hostBrand].ogDescription,
                image: ogImageFromForm(def),
                url: `${baseUrl}/`,
              }));
          }
          // No default form set for this brand yet.
          if (hostBrand !== "one") {
            // Vitacon (and future brands) → generic brand title, never show One branding
            return res
              .status(200)
              .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, max-age=0, must-revalidate" })
              .end(renderOgHtml({
                title: `${BRANDS[hostBrand].label} | Cadastro Digital`,
                description: BRANDS[hostBrand].ogDescription,
                image: "",
                url: `${baseUrl}/`,
              }));
          }
          // 'one' with no default form → fall through to global site settings below
        }

        // Apex / One / unknown host → global site settings
        const settings = await getCachedSiteSettings();
        return res
          .status(200)
          .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, max-age=0, must-revalidate" })
          .end(renderOgHtml({
            title: settings?.ogTitle || DEFAULT_OG_TITLE,
            description: settings?.ogDescription || DEFAULT_OG_DESCRIPTION,
            image: settings?.ogImage || "",
            url: settings?.ogUrl || baseUrl,
          }));
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
      // Resolve the form scoped to the host brand (same slug can exist per brand)
      const form = await getFormBySlug(slug, hostBrand ?? undefined);
      if (!form) {
        // Unknown slug. On a brand subdomain, NEVER fall through to the static
        // index.html (it carries hardcoded One Innovation OG). Render the brand's
        // own generic fallback instead — brand title, brand description, no image.
        if (hostBrand) {
          return res
            .status(200)
            .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, max-age=0, must-revalidate" })
            .end(renderOgHtml({
              title: `${BRANDS[hostBrand].label} | Cadastro Digital`,
              description: BRANDS[hostBrand].ogDescription,
              image: "",
              url: `${baseUrl}/${slug}`,
            }));
        }
        return next();
      }

      // Extract OG fields from design, with fallbacks to form title/description
      let ogTitle = form.title || "Cadastro Digital";
      let ogDescription = form.description || "Preencha o formulário de forma segura e digital.";

      try {
        if (form.design && typeof form.design === "object") {
          const design = form.design as any;
          if (design.ogTitle) ogTitle = design.ogTitle;
          if (design.ogDescription) ogDescription = design.ogDescription;
        }
      } catch {
        // ignore parse errors
      }

      return res
        .status(200)
        .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, max-age=0, must-revalidate" })
        .end(renderOgHtml({
          title: ogTitle,
          description: ogDescription,
          image: ogImageFromForm(form),
          url: `${baseUrl}/${slug}`,
        }));
    } catch (err) {
      // On any error, fall through to the SPA
      console.warn("[OG Middleware] Error:", (err as Error).message);
      return next();
    }
  };
}
