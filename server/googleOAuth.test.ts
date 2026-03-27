/**
 * Tests for Google OAuth credentials and service
 */
import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Google OAuth credentials", () => {
  it("should have GOOGLE_CLIENT_ID configured", () => {
    expect(ENV.googleClientId).toBeTruthy();
    expect(ENV.googleClientId.length).toBeGreaterThan(10);
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    expect(ENV.googleClientSecret).toBeTruthy();
    expect(ENV.googleClientSecret.length).toBeGreaterThan(5);
  });

  it("GOOGLE_CLIENT_ID should look like a valid OAuth client ID", () => {
    // Google OAuth client IDs typically end with .apps.googleusercontent.com
    // or are numeric strings for some project types
    const id = ENV.googleClientId;
    const isValidFormat =
      id.includes(".apps.googleusercontent.com") ||
      id.includes("-") ||
      /^\d+$/.test(id);
    expect(isValidFormat).toBe(true);
  });
});

describe("Google OAuth URL generation", () => {
  it("should generate a valid auth URL structure", async () => {
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      ENV.googleClientId,
      ENV.googleClientSecret,
      "https://example.com/google-oauth-callback"
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });

    expect(url).toContain("accounts.google.com");
    expect(url).toContain("oauth2");
    expect(url).toContain("spreadsheets");
  });
});
