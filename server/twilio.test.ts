import { describe, it, expect } from "vitest";

describe("Twilio Verify credentials validation", () => {
  it("should have Twilio env vars configured", () => {
    expect(process.env.TWILIO_ACCOUNT_SID).toBeTruthy();
    expect(process.env.TWILIO_ACCOUNT_SID).toMatch(/^AC/);
    expect(process.env.TWILIO_AUTH_TOKEN).toBeTruthy();
    expect(process.env.TWILIO_VERIFY_SERVICE_SID).toBeTruthy();
    expect(process.env.TWILIO_VERIFY_SERVICE_SID).toMatch(/^VA/);
  });

  it("should be able to initialize Twilio client and fetch Verify service", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

    // Use fetch to call Twilio API directly to validate credentials
    const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}`;
    const response = await fetch(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sid).toBe(verifyServiceSid);
    expect(data.friendly_name).toBeTruthy();
    console.log(`[Twilio Test] Verify Service: ${data.friendly_name}, SID: ${data.sid}`);
  });
});
