/**
 * Brand / domain configuration.
 *
 * Each form belongs to a brand (stored in its `sharing.brand` field).
 * The brand determines which subdomain the public form lives on, and which
 * brand's forms are shown when visiting that subdomain.
 *
 * Visual identity (logo, colors, brand kit) comes from each form's own
 * `design` settings — this file only maps brand → domain.
 */

export type BrandKey = "one" | "vitacon";

export interface BrandConfig {
  key: BrandKey;
  label: string;
  host: string;
  /** Primary brand color (hex) — One is blue, Vitacon is gray. Used in PDFs/emails. */
  primaryColor: string;
  /** Logo URL for PDF/email headers. Empty string → text fallback (the label). */
  logoUrl: string;
  /** Footer line used in generated PDFs. */
  pdfFooter: string;
  /** Sender display name for transactional emails. */
  emailFromName: string;
}

export const BRANDS: Record<BrandKey, BrandConfig> = {
  one: {
    key: "one",
    label: "One Innovation",
    host: "one.cadastrodigital.com.br",
    primaryColor: "#0D8BD9",
    logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663342930280/idQysuOkKZvswPXU.png",
    pdfFooter: "Cadastro Digital — One Innovation",
    emailFromName: "One Innovation",
  },
  vitacon: {
    key: "vitacon",
    label: "Vitacon",
    host: "vitacon.cadastrodigital.com.br",
    primaryColor: "#4A4A4F", // cinza Vitacon
    logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/uploads/pXc_q0ax-vitacon%20logo.png", // logo branco (vai sobre faixa cinza no PDF / fundo cinza no e-mail)
    pdfFooter: "Cadastro Digital — Vitacon",
    emailFromName: "Vitacon",
  },
};

export const BRAND_LIST: BrandConfig[] = [BRANDS.one, BRANDS.vitacon];

export const DEFAULT_BRAND: BrandKey = "one";

/**
 * The default/primary brand for *visible site URLs* — links, OG fallback, emails
 * and notifications when there's no host or form brand to derive it from.
 * Decoupled from DEFAULT_BRAND (which controls untagged-form ownership) on purpose:
 * changing this flips "the site default" without re-assigning any form's brand.
 */
export const DEFAULT_SITE_BRAND: BrandKey = "vitacon";

/** Default canonical site URL (fallback for links/OG/emails when brand is unknown). */
export const DEFAULT_SITE_URL = `https://${BRANDS[DEFAULT_SITE_BRAND].host}`;

/** The shared root domain — host-based brand routing only applies under it. */
export const BRAND_ROOT_DOMAIN = "cadastrodigital.com.br";

/** Normalize any stored value to a valid brand key (defaults to "one"). */
export function brandFromValue(value: unknown): BrandKey {
  return value === "vitacon" ? "vitacon" : "one";
}

/** The brand that owns a given hostname, or null if it's not a brand domain. */
export function brandFromHost(hostname: string): BrandKey | null {
  if (!hostname.endsWith(BRAND_ROOT_DOMAIN)) return null;
  if (hostname.startsWith("vitacon.")) return "vitacon";
  if (hostname.startsWith("one.")) return "one";
  return null;
}
