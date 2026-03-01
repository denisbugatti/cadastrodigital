/**
 * Country data for phone input with flag emoji, dial code, and mask.
 * Brazil is first (default). Then popular countries, then alphabetical.
 */

export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Country name in Portuguese
  flag: string;       // Flag emoji
  dialCode: string;   // International dial code (e.g., "+55")
  mask: string;       // Phone mask pattern (0 = digit)
  maxDigits: number;  // Max digits after dial code
}

export const countries: Country[] = [
  // Default — Brazil
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55", mask: "(00) 00000-0000", maxDigits: 11 },

  // Popular countries
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1", mask: "(000) 000-0000", maxDigits: 10 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351", mask: "000 000 000", maxDigits: 9 },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54", mask: "00 0000-0000", maxDigits: 10 },
  { code: "UY", name: "Uruguai", flag: "🇺🇾", dialCode: "+598", mask: "00 000 000", maxDigits: 8 },
  { code: "PY", name: "Paraguai", flag: "🇵🇾", dialCode: "+595", mask: "000 000 000", maxDigits: 9 },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56", mask: "0 0000 0000", maxDigits: 9 },
  { code: "CO", name: "Colômbia", flag: "🇨🇴", dialCode: "+57", mask: "000 000 0000", maxDigits: 10 },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52", mask: "00 0000 0000", maxDigits: 10 },
  { code: "PE", name: "Peru", flag: "🇵🇪", dialCode: "+51", mask: "000 000 000", maxDigits: 9 },

  // Europe
  { code: "DE", name: "Alemanha", flag: "🇩🇪", dialCode: "+49", mask: "0000 0000000", maxDigits: 11 },
  { code: "ES", name: "Espanha", flag: "🇪🇸", dialCode: "+34", mask: "000 000 000", maxDigits: 9 },
  { code: "FR", name: "França", flag: "🇫🇷", dialCode: "+33", mask: "0 00 00 00 00", maxDigits: 9 },
  { code: "IT", name: "Itália", flag: "🇮🇹", dialCode: "+39", mask: "000 000 0000", maxDigits: 10 },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44", mask: "0000 000000", maxDigits: 10 },

  // Other
  { code: "JP", name: "Japão", flag: "🇯🇵", dialCode: "+81", mask: "00-0000-0000", maxDigits: 10 },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86", mask: "000 0000 0000", maxDigits: 11 },
  { code: "IN", name: "Índia", flag: "🇮🇳", dialCode: "+91", mask: "00000 00000", maxDigits: 10 },
  { code: "AU", name: "Austrália", flag: "🇦🇺", dialCode: "+61", mask: "0000 000 000", maxDigits: 9 },
  { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1", mask: "(000) 000-0000", maxDigits: 10 },
  { code: "AE", name: "Emirados Árabes", flag: "🇦🇪", dialCode: "+971", mask: "00 000 0000", maxDigits: 9 },
  { code: "IL", name: "Israel", flag: "🇮🇱", dialCode: "+972", mask: "00-000-0000", maxDigits: 9 },
  { code: "ZA", name: "África do Sul", flag: "🇿🇦", dialCode: "+27", mask: "00 000 0000", maxDigits: 9 },
  { code: "BO", name: "Bolívia", flag: "🇧🇴", dialCode: "+591", mask: "0000 0000", maxDigits: 8 },
  { code: "EC", name: "Equador", flag: "🇪🇨", dialCode: "+593", mask: "00 000 0000", maxDigits: 9 },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58", mask: "000-0000000", maxDigits: 10 },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506", mask: "0000 0000", maxDigits: 8 },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507", mask: "0000-0000", maxDigits: 8 },
  { code: "DO", name: "Rep. Dominicana", flag: "🇩🇴", dialCode: "+1", mask: "(000) 000-0000", maxDigits: 10 },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53", mask: "0 000 0000", maxDigits: 8 },
  { code: "KR", name: "Coreia do Sul", flag: "🇰🇷", dialCode: "+82", mask: "00-0000-0000", maxDigits: 10 },
  { code: "NG", name: "Nigéria", flag: "🇳🇬", dialCode: "+234", mask: "000 000 0000", maxDigits: 10 },
  { code: "EG", name: "Egito", flag: "🇪🇬", dialCode: "+20", mask: "000 000 0000", maxDigits: 10 },
  { code: "SA", name: "Arábia Saudita", flag: "🇸🇦", dialCode: "+966", mask: "00 000 0000", maxDigits: 9 },
  { code: "RU", name: "Rússia", flag: "🇷🇺", dialCode: "+7", mask: "(000) 000-00-00", maxDigits: 10 },
  { code: "TR", name: "Turquia", flag: "🇹🇷", dialCode: "+90", mask: "(000) 000 00 00", maxDigits: 10 },
  { code: "PL", name: "Polônia", flag: "🇵🇱", dialCode: "+48", mask: "000 000 000", maxDigits: 9 },
  { code: "NL", name: "Holanda", flag: "🇳🇱", dialCode: "+31", mask: "0 00000000", maxDigits: 9 },
  { code: "SE", name: "Suécia", flag: "🇸🇪", dialCode: "+46", mask: "00-000 00 00", maxDigits: 9 },
  { code: "CH", name: "Suíça", flag: "🇨🇭", dialCode: "+41", mask: "00 000 00 00", maxDigits: 9 },
  { code: "AT", name: "Áustria", flag: "🇦🇹", dialCode: "+43", mask: "0000 000000", maxDigits: 10 },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", dialCode: "+32", mask: "000 00 00 00", maxDigits: 9 },
  { code: "NO", name: "Noruega", flag: "🇳🇴", dialCode: "+47", mask: "000 00 000", maxDigits: 8 },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", dialCode: "+45", mask: "00 00 00 00", maxDigits: 8 },
  { code: "FI", name: "Finlândia", flag: "🇫🇮", dialCode: "+358", mask: "00 000 0000", maxDigits: 9 },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", dialCode: "+353", mask: "00 000 0000", maxDigits: 9 },
  { code: "GR", name: "Grécia", flag: "🇬🇷", dialCode: "+30", mask: "000 000 0000", maxDigits: 10 },
  { code: "CZ", name: "Rep. Tcheca", flag: "🇨🇿", dialCode: "+420", mask: "000 000 000", maxDigits: 9 },
  { code: "RO", name: "Romênia", flag: "🇷🇴", dialCode: "+40", mask: "000 000 000", maxDigits: 9 },
  { code: "HU", name: "Hungria", flag: "🇭🇺", dialCode: "+36", mask: "00 000 0000", maxDigits: 9 },
  { code: "TH", name: "Tailândia", flag: "🇹🇭", dialCode: "+66", mask: "00 000 0000", maxDigits: 9 },
  { code: "SG", name: "Singapura", flag: "🇸🇬", dialCode: "+65", mask: "0000 0000", maxDigits: 8 },
  { code: "NZ", name: "Nova Zelândia", flag: "🇳🇿", dialCode: "+64", mask: "00 000 0000", maxDigits: 9 },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", dialCode: "+63", mask: "000 000 0000", maxDigits: 10 },
  { code: "MY", name: "Malásia", flag: "🇲🇾", dialCode: "+60", mask: "00-000 0000", maxDigits: 9 },
  { code: "ID", name: "Indonésia", flag: "🇮🇩", dialCode: "+62", mask: "000-0000-0000", maxDigits: 11 },
  { code: "AO", name: "Angola", flag: "🇦🇴", dialCode: "+244", mask: "000 000 000", maxDigits: 9 },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿", dialCode: "+258", mask: "00 000 0000", maxDigits: 9 },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻", dialCode: "+238", mask: "000 0000", maxDigits: 7 },
  { code: "GW", name: "Guiné-Bissau", flag: "🇬🇼", dialCode: "+245", mask: "000 0000", maxDigits: 7 },
  { code: "ST", name: "São Tomé e Príncipe", flag: "🇸🇹", dialCode: "+239", mask: "000 0000", maxDigits: 7 },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", dialCode: "+670", mask: "000 0000", maxDigits: 7 },
];

/**
 * Apply a phone mask based on country pattern.
 * The mask uses '0' as digit placeholder.
 */
export function maskPhoneForCountry(value: string, country: Country): string {
  const digits = value.replace(/\D/g, "").slice(0, country.maxDigits);
  if (!digits) return "";

  const mask = country.mask;
  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === "0") {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += mask[i];
    }
  }

  return result;
}

/**
 * Get the full phone number with dial code
 */
export function getFullPhoneNumber(localNumber: string, country: Country): string {
  const digits = localNumber.replace(/\D/g, "");
  if (!digits) return "";
  return `${country.dialCode}${digits}`;
}
