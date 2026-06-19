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
}

export const BRANDS: Record<BrandKey, BrandConfig> = {
  one: { key: "one", label: "One Innovation", host: "one.cadastrodigital.com.br" },
  vitacon: { key: "vitacon", label: "Vitacon", host: "vitacon.cadastrodigital.com.br" },
};

export const BRAND_LIST: BrandConfig[] = [BRANDS.one, BRANDS.vitacon];

export const DEFAULT_BRAND: BrandKey = "one";

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
