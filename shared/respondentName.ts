/**
 * Helper to extract the respondent's first name from form answers.
 *
 * Logic:
 * - If answers contain a PJ sócio name field → use first name of the sócio
 * - Otherwise → use first name from PF name field
 * - Falls back to the full respondentName stored in the DB if no match
 */

/** All known field keys that hold the respondent's full name (PF) */
const PF_NAME_KEYS = [
  "q23_pf_nome",
  "one_pf_nome",
  "pf_nome",
  "nome",
];

/** All known field keys that hold the sócio's full name (PJ) */
const PJ_SOCIO_KEYS = [
  "q3_pj_nome_socio",
  "one_pj_nome_socio",
  "pj_nome_socio",
  "nome_socio",
];

/**
 * Returns only the first word (first name) of a full name string.
 * e.g. "Alex Antonio Lopes de Carvalho" → "Alex"
 */
function firstWord(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

/**
 * Detects whether the response is PJ by checking for the presence of
 * any PJ-specific sócio field in answers.
 */
function isPJ(answers: Record<string, unknown>): boolean {
  return PJ_SOCIO_KEYS.some((k) => k in answers && typeof answers[k] === "string" && (answers[k] as string).trim().length > 0);
}

/**
 * Extract the best display name from form answers.
 * Returns the first name only (e.g. "Alex" not "Alex Antonio Lopes").
 * Falls back to `fallbackName` if no name field is found.
 */
export function extractFirstName(
  answers: Record<string, unknown> | null | undefined,
  fallbackName?: string | null
): string {
  if (!answers) return fallbackName ? firstWord(fallbackName) : "Anônimo";

  // PJ: use sócio name
  if (isPJ(answers)) {
    for (const key of PJ_SOCIO_KEYS) {
      const val = answers[key];
      if (typeof val === "string" && val.trim()) {
        return firstWord(val);
      }
    }
  }

  // PF: use nome field
  for (const key of PF_NAME_KEYS) {
    const val = answers[key];
    if (typeof val === "string" && val.trim()) {
      return firstWord(val);
    }
  }

  // Last resort: scan all keys for anything containing "nome"
  for (const [k, v] of Object.entries(answers)) {
    if (
      (k.toLowerCase().includes("nome") || k.toLowerCase().includes("name")) &&
      typeof v === "string" &&
      v.trim() &&
      !k.toLowerCase().includes("empresa") &&
      !k.toLowerCase().includes("fantasia")
    ) {
      return firstWord(v);
    }
  }

  return fallbackName ? firstWord(fallbackName) : "Anônimo";
}
