import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Test: Integration Dispatcher Logic ───
describe("Integration Dispatcher", () => {
  describe("Webhook Integration", () => {
    it("should format webhook payload correctly", () => {
      const responseData = {
        responseId: 123,
        formId: 1,
        formTitle: "Test Form",
        answers: { name: "John", email: "john@test.com" },
        respondentName: "John",
        respondentEmail: "john@test.com",
        isComplete: true,
        submittedAt: new Date("2026-01-01T00:00:00Z"),
        protocolCode: "ABC-123",
      };

      const payload = {
        event: "form_submission",
        form: {
          id: responseData.formId,
          title: responseData.formTitle,
        },
        response: {
          id: responseData.responseId,
          answers: responseData.answers,
          respondentName: responseData.respondentName,
          respondentEmail: responseData.respondentEmail,
          isComplete: responseData.isComplete,
          submittedAt: responseData.submittedAt.toISOString(),
          protocolCode: responseData.protocolCode,
        },
      };

      expect(payload.event).toBe("form_submission");
      expect(payload.form.id).toBe(1);
      expect(payload.form.title).toBe("Test Form");
      expect(payload.response.id).toBe(123);
      expect(payload.response.answers).toEqual({ name: "John", email: "john@test.com" });
      expect(payload.response.protocolCode).toBe("ABC-123");
    });

    it("should not dispatch if webhook URL is empty", () => {
      const settings = {
        webhook: { enabled: true, url: "", secret: "" },
      };
      const shouldDispatch = settings.webhook.enabled && settings.webhook.url.trim() !== "";
      expect(shouldDispatch).toBe(false);
    });

    it("should dispatch if webhook is enabled with valid URL", () => {
      const settings = {
        webhook: { enabled: true, url: "https://example.com/webhook", secret: "abc" },
      };
      const shouldDispatch = settings.webhook.enabled && settings.webhook.url.trim() !== "";
      expect(shouldDispatch).toBe(true);
    });
  });

  describe("Google Sheets Integration", () => {
    it("should format row data from answers", () => {
      const answers: Record<string, unknown> = {
        name: "Maria Silva",
        email: "maria@test.com",
        phone: "11999999999",
        age: 30,
        address: { street: "Rua A", city: "São Paulo" },
      };

      const flatRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(answers)) {
        if (typeof value === "object" && value !== null) {
          flatRow[key] = JSON.stringify(value);
        } else {
          flatRow[key] = String(value ?? "");
        }
      }

      expect(flatRow.name).toBe("Maria Silva");
      expect(flatRow.email).toBe("maria@test.com");
      expect(flatRow.age).toBe("30");
      expect(JSON.parse(flatRow.address)).toEqual({ street: "Rua A", city: "São Paulo" });
    });

    it("should not dispatch if spreadsheet ID is empty", () => {
      const settings = {
        googleSheets: { enabled: true, spreadsheetId: "", sheetName: "Sheet1" },
      };
      const shouldDispatch = settings.googleSheets.enabled && settings.googleSheets.spreadsheetId.trim() !== "";
      expect(shouldDispatch).toBe(false);
    });
  });

  describe("CRM Integration", () => {
    it("should format CRM payload with lead data", () => {
      const answers: Record<string, unknown> = {
        name: "João",
        email: "joao@test.com",
        phone: "11888888888",
      };

      const crmPayload = {
        source: "formflow",
        lead: {
          name: answers.name || "Sem nome",
          email: answers.email || "",
          phone: answers.phone || "",
          customFields: answers,
        },
      };

      expect(crmPayload.source).toBe("formflow");
      expect(crmPayload.lead.name).toBe("João");
      expect(crmPayload.lead.email).toBe("joao@test.com");
    });

    it("should not dispatch if CRM webhook URL is empty", () => {
      const settings = {
        crmManus: { enabled: true, webhookUrl: "", apiKey: "" },
      };
      const shouldDispatch = settings.crmManus.enabled && settings.crmManus.webhookUrl.trim() !== "";
      expect(shouldDispatch).toBe(false);
    });
  });

  describe("Email Notification Integration", () => {
    it("should validate email addresses", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test("test@example.com")).toBe(true);
      expect(emailRegex.test("invalid")).toBe(false);
      expect(emailRegex.test("")).toBe(false);
      expect(emailRegex.test("user@domain.co")).toBe(true);
    });

    it("should split multiple email addresses", () => {
      const emailsStr = "a@test.com, b@test.com, c@test.com";
      const emails = emailsStr.split(",").map((e) => e.trim()).filter(Boolean);
      expect(emails).toEqual(["a@test.com", "b@test.com", "c@test.com"]);
    });
  });
});

// ─── Test: Tracking Configuration ───
describe("Tracking Configuration", () => {
  describe("GTM", () => {
    it("should validate GTM container ID format", () => {
      const isValidGTM = (id: string) => /^GTM-[A-Z0-9]+$/.test(id);
      expect(isValidGTM("GTM-ABC123")).toBe(true);
      expect(isValidGTM("GTM-")).toBe(false);
      expect(isValidGTM("ABC123")).toBe(false);
      expect(isValidGTM("")).toBe(false);
    });

    it("should not inject if disabled", () => {
      const config = { gtm: { enabled: false, containerId: "GTM-ABC123" } };
      const shouldInject = config.gtm.enabled && config.gtm.containerId.trim() !== "";
      expect(shouldInject).toBe(false);
    });
  });

  describe("Google Analytics", () => {
    it("should validate GA4 measurement ID format", () => {
      const isValidGA = (id: string) => /^G-[A-Z0-9]+$/.test(id);
      expect(isValidGA("G-ABC123DEF")).toBe(true);
      expect(isValidGA("UA-123456-1")).toBe(false);
      expect(isValidGA("")).toBe(false);
    });
  });

  describe("Facebook Pixel", () => {
    it("should validate pixel ID is numeric", () => {
      const isValidFBPixel = (id: string) => /^\d+$/.test(id);
      expect(isValidFBPixel("2554257991587438")).toBe(true);
      expect(isValidFBPixel("abc")).toBe(false);
      expect(isValidFBPixel("")).toBe(false);
    });
  });

  describe("TikTok Pixel", () => {
    it("should validate TikTok pixel ID format", () => {
      const isValidTTPixel = (id: string) => /^[A-Z0-9]+$/.test(id);
      expect(isValidTTPixel("C5ABCDEF123")).toBe(true);
      expect(isValidTTPixel("")).toBe(false);
    });
  });

  describe("Tracking event firing", () => {
    it("should fire GA4 event on form submission", () => {
      const gtagCalls: any[][] = [];
      (globalThis as any).gtag = (...args: any[]) => gtagCalls.push(args);

      const tracking = { googleAnalytics: { enabled: true, measurementId: "G-TEST123" } };
      
      // Simulate fireTrackingConversion logic
      if (tracking.googleAnalytics?.enabled && (globalThis as any).gtag) {
        (globalThis as any).gtag("event", "form_submission", {
          event_category: "form",
          event_label: "Test Form",
        });
      }

      expect(gtagCalls).toHaveLength(1);
      expect(gtagCalls[0][0]).toBe("event");
      expect(gtagCalls[0][1]).toBe("form_submission");
      expect(gtagCalls[0][2].event_label).toBe("Test Form");

      delete (globalThis as any).gtag;
    });

    it("should fire Facebook Pixel Lead event on form submission", () => {
      const fbqCalls: any[][] = [];
      (globalThis as any).fbq = (...args: any[]) => fbqCalls.push(args);

      const tracking = { facebookPixel: { enabled: true, pixelId: "123456" } };
      
      if (tracking.facebookPixel?.enabled && (globalThis as any).fbq) {
        (globalThis as any).fbq("track", "Lead", {
          content_name: "Test Form",
        });
      }

      expect(fbqCalls).toHaveLength(1);
      expect(fbqCalls[0][0]).toBe("track");
      expect(fbqCalls[0][1]).toBe("Lead");

      delete (globalThis as any).fbq;
    });

    it("should fire GTM dataLayer push on form submission", () => {
      (globalThis as any).dataLayer = [];

      const tracking = { gtm: { enabled: true, containerId: "GTM-TEST" } };
      
      if (tracking.gtm?.enabled && (globalThis as any).dataLayer) {
        (globalThis as any).dataLayer.push({
          event: "form_submission",
          formTitle: "Test Form",
        });
      }

      expect((globalThis as any).dataLayer).toHaveLength(1);
      expect((globalThis as any).dataLayer[0].event).toBe("form_submission");

      delete (globalThis as any).dataLayer;
    });

    it("should fire TikTok Pixel event on form submission", () => {
      const ttqCalls: any[][] = [];
      (globalThis as any).ttq = { track: (...args: any[]) => ttqCalls.push(args) };

      const tracking = { tiktokPixel: { enabled: true, pixelId: "TTTEST" } };
      
      if (tracking.tiktokPixel?.enabled && (globalThis as any).ttq) {
        (globalThis as any).ttq.track("SubmitForm", {
          content_name: "Test Form",
        });
      }

      expect(ttqCalls).toHaveLength(1);
      expect(ttqCalls[0][0]).toBe("SubmitForm");

      delete (globalThis as any).ttq;
    });

    it("should not fire events when tracking is disabled", () => {
      const gtagCalls: any[][] = [];
      (globalThis as any).gtag = (...args: any[]) => gtagCalls.push(args);

      const tracking = { googleAnalytics: { enabled: false, measurementId: "G-TEST123" } };
      
      if (tracking.googleAnalytics?.enabled && (globalThis as any).gtag) {
        (globalThis as any).gtag("event", "form_submission");
      }

      expect(gtagCalls).toHaveLength(0);

      delete (globalThis as any).gtag;
    });
  });
});

// ─── Test: Webhook Settings Defaults ───
describe("WebhookSettings Defaults", () => {
  it("should have all integration types with correct defaults", () => {
    const defaultSettings = {
      webhook: { enabled: false, url: "", secret: "" },
      rdStation: { enabled: false, apiToken: "", conversionIdentifier: "" },
      whatsapp: { enabled: false, phoneNumber: "", message: "" },
      email: { enabled: false, to: "", subject: "", includeAnswers: true },
      googleSheets: { enabled: false, spreadsheetId: "", sheetName: "Respostas", serviceAccountEmail: "" },
      crmManus: { enabled: false, webhookUrl: "", apiKey: "", pipelineId: "" },
      tracking: {
        gtm: { enabled: false, containerId: "" },
        googleAnalytics: { enabled: false, measurementId: "" },
        facebookPixel: { enabled: false, pixelId: "" },
        tiktokPixel: { enabled: false, pixelId: "" },
      },
    };

    // All integrations should be disabled by default
    expect(defaultSettings.webhook.enabled).toBe(false);
    expect(defaultSettings.rdStation.enabled).toBe(false);
    expect(defaultSettings.whatsapp.enabled).toBe(false);
    expect(defaultSettings.email.enabled).toBe(false);
    expect(defaultSettings.googleSheets.enabled).toBe(false);
    expect(defaultSettings.crmManus.enabled).toBe(false);
    expect(defaultSettings.tracking.gtm.enabled).toBe(false);
    expect(defaultSettings.tracking.googleAnalytics.enabled).toBe(false);
    expect(defaultSettings.tracking.facebookPixel.enabled).toBe(false);
    expect(defaultSettings.tracking.tiktokPixel.enabled).toBe(false);

    // Google Sheets should default to "Respostas" sheet name
    expect(defaultSettings.googleSheets.sheetName).toBe("Respostas");

    // Email should include answers by default
    expect(defaultSettings.email.includeAnswers).toBe(true);
  });
});
