/**
 * Google OAuth Service
 * Handles Google OAuth2 flow for Google Sheets integration.
 * Users authorize via Google login — no Service Account required.
 */

import { google } from "googleapis";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { googleOAuthTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

function createOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

/** Generate the Google OAuth authorization URL */
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const oauth2Client = createOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent", // Force consent to always get refresh_token
  });
}

/** Exchange authorization code for tokens and save to DB */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  staffUserId: number
): Promise<{ googleEmail: string; googleName: string }> {
  const oauth2Client = createOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("No access token received from Google");
  }

  // Get user info
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const googleEmail = userInfo.email ?? "";
  const googleName = userInfo.name ?? "";

  // Upsert token in DB
  const existing = await getDb()
    .select({ id: googleOAuthTokens.id })
    .from(googleOAuthTokens)
    .where(eq(googleOAuthTokens.staffUserId, staffUserId))
    .limit(1);

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  if (existing.length > 0) {
    await getDb()
      .update(googleOAuthTokens)
      .set({
        googleEmail,
        googleName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: expiresAt ?? undefined,
        scope: tokens.scope ?? undefined,
      })
      .where(eq(googleOAuthTokens.staffUserId, staffUserId));
  } else {
    await getDb().insert(googleOAuthTokens).values({
      staffUserId,
      googleEmail,
      googleName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: expiresAt ?? undefined,
      scope: tokens.scope ?? undefined,
    });
  }

  return { googleEmail, googleName };
}

/** Get a valid OAuth2 client for a staff user, refreshing token if needed */
export async function getAuthClientForUser(staffUserId: number) {
  const rows = await getDb()
    .select()
    .from(googleOAuthTokens)
    .where(eq(googleOAuthTokens.staffUserId, staffUserId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Google account not connected. Please authorize via Google OAuth.");
  }

  const tokenRow = rows[0];
  const oauth2Client = new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.accessToken,
    refresh_token: tokenRow.refreshToken ?? undefined,
    expiry_date: tokenRow.expiresAt?.getTime(),
  });

  // Auto-refresh: listen for new tokens
  oauth2Client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await getDb()
        .update(googleOAuthTokens)
        .set({
          accessToken: newTokens.access_token,
          expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
        })
        .where(eq(googleOAuthTokens.staffUserId, staffUserId));
    }
  });

  return oauth2Client;
}

/** List spreadsheets from Google Drive for the authenticated user */
export async function listSpreadsheets(staffUserId: number): Promise<
  Array<{ id: string; name: string; modifiedTime: string }>
> {
  const auth = await getAuthClientForUser(staffUserId);
  const drive = google.drive({ version: "v3", auth });

  const { data } = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 50,
  });

  return (data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "Sem título",
    modifiedTime: f.modifiedTime ?? "",
  }));
}

/** Create a new spreadsheet in Google Drive */
export async function createSpreadsheet(
  staffUserId: number,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const auth = await getAuthClientForUser(staffUserId);
  const sheets = google.sheets({ version: "v4", auth });

  const { data } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: "Respostas" } }],
    },
  });

  return {
    spreadsheetId: data.spreadsheetId ?? "",
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
  };
}

/** Get the connected Google account for a staff user */
export async function getConnectedAccount(staffUserId: number): Promise<{
  connected: boolean;
  googleEmail?: string;
  googleName?: string;
} > {
  const rows = await getDb()
    .select({
      googleEmail: googleOAuthTokens.googleEmail,
      googleName: googleOAuthTokens.googleName,
    })
    .from(googleOAuthTokens)
    .where(eq(googleOAuthTokens.staffUserId, staffUserId))
    .limit(1);

  if (rows.length === 0) return { connected: false };
  return { connected: true, ...rows[0] };
}

/** Disconnect Google account for a staff user */
export async function disconnectGoogleAccount(staffUserId: number): Promise<void> {
  await getDb()
    .delete(googleOAuthTokens)
    .where(eq(googleOAuthTokens.staffUserId, staffUserId));
}

/** Append a row to a Google Sheet using OAuth token */
export async function appendRowToSheet(
  staffUserId: number,
  spreadsheetId: string,
  sheetName: string,
  values: string[]
): Promise<void> {
  const auth = await getAuthClientForUser(staffUserId);
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}
