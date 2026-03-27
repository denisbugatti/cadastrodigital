/**
 * Google Sheets Service — handles authentication via Service Account
 * and appending rows to spreadsheets.
 *
 * The service account JSON key is stored encrypted in the form's webhook settings.
 * When the user uploads the JSON key file, it's stored as a JSON string.
 */

import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

// ─── Types ───

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface GoogleSheetsConfig {
  spreadsheetUrl: string;
  sheetName: string;
  serviceAccountJson?: string; // JSON string of the service account key
}

interface AppendRowResult {
  success: boolean;
  error?: string;
  updatedRange?: string;
}

// ─── Auth & Client ───

function getAuthClient(serviceAccountJson: string) {
  const key: ServiceAccountKey = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: key.client_email,
      private_key: key.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth;
}

function getSheetsClient(auth: InstanceType<typeof google.auth.GoogleAuth>): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth });
}

// ─── Extract Spreadsheet ID ───

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// ─── Append Row ───

export async function appendRowToSheet(
  config: GoogleSheetsConfig,
  row: string[]
): Promise<AppendRowResult> {
  try {
    if (!config.serviceAccountJson) {
      return { success: false, error: "Chave de conta de serviço não configurada" };
    }

    const spreadsheetId = extractSpreadsheetId(config.spreadsheetUrl);
    if (!spreadsheetId) {
      return { success: false, error: "URL da planilha inválida" };
    }

    const sheetName = config.sheetName || "Respostas";
    const auth = getAuthClient(config.serviceAccountJson);
    const sheets = getSheetsClient(auth);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange || undefined,
    };
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    // Provide friendly error messages
    if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
      return {
        success: false,
        error: "Permissão negada. Verifique se a planilha foi compartilhada com o email da conta de serviço.",
      };
    }
    if (message.includes("NOT_FOUND") || message.includes("404")) {
      return {
        success: false,
        error: "Planilha não encontrada. Verifique a URL e o nome da aba.",
      };
    }
    return { success: false, error: message.substring(0, 500) };
  }
}

// ─── Create Headers ───

export async function ensureHeaderRow(
  config: GoogleSheetsConfig,
  headers: string[]
): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  try {
    if (!config.serviceAccountJson) {
      return { success: false, error: "Chave de conta de serviço não configurada" };
    }

    const spreadsheetId = extractSpreadsheetId(config.spreadsheetUrl);
    if (!spreadsheetId) {
      return { success: false, error: "URL da planilha inválida" };
    }

    const sheetName = config.sheetName || "Respostas";
    const auth = getAuthClient(config.serviceAccountJson);
    const sheets = getSheetsClient(auth);

    // Check if first row already has content
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    if (existing.data.values && existing.data.values.length > 0 && existing.data.values[0].length > 0) {
      return { success: true, alreadyExists: true };
    }

    // Write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });

    return { success: true, alreadyExists: false };
  } catch (err: any) {
    return { success: false, error: (err?.message || "Erro desconhecido").substring(0, 500) };
  }
}

// ─── Test Connection ───

export async function testGoogleSheetsConnection(
  config: GoogleSheetsConfig
): Promise<{ success: boolean; error?: string; sheetTitle?: string; serviceAccountEmail?: string }> {
  try {
    if (!config.serviceAccountJson) {
      return { success: false, error: "Chave de conta de serviço não configurada" };
    }

    const spreadsheetId = extractSpreadsheetId(config.spreadsheetUrl);
    if (!spreadsheetId) {
      return { success: false, error: "URL da planilha inválida" };
    }

    const key: ServiceAccountKey = JSON.parse(config.serviceAccountJson);
    const auth = getAuthClient(config.serviceAccountJson);
    const sheets = getSheetsClient(auth);

    // Try to get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });

    const sheetTitle = metadata.data.properties?.title || "Sem título";

    // Check if the target sheet exists
    const sheetName = config.sheetName || "Respostas";
    const sheetExists = metadata.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );

    if (!sheetExists) {
      const availableSheets = metadata.data.sheets?.map((s) => s.properties?.title).join(", ");
      return {
        success: false,
        error: `Aba "${sheetName}" não encontrada. Abas disponíveis: ${availableSheets}`,
        serviceAccountEmail: key.client_email,
      };
    }

    return {
      success: true,
      sheetTitle,
      serviceAccountEmail: key.client_email,
    };
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    if (message.includes("invalid_grant") || message.includes("Invalid JWT")) {
      return { success: false, error: "Chave de conta de serviço inválida ou expirada." };
    }
    if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
      return {
        success: false,
        error: "Permissão negada. Compartilhe a planilha com o email da conta de serviço.",
      };
    }
    return { success: false, error: message.substring(0, 500) };
  }
}
