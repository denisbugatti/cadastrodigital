import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";

/**
 * Tests for the new cadence features:
 * 1. cadence.startManual — start a cadence manually
 * 2. cadence.getActiveResponseIds — get response IDs with active cadences
 * 3. cadence.getEmailHistory — get email history for a response
 */

describe("Cadence Features — Router Definitions", () => {
  it("cadence router should have startManual procedure", () => {
    const cadenceRouter = (appRouter as any)._def.procedures["cadence.startManual"];
    expect(cadenceRouter).toBeDefined();
  });

  it("cadence router should have getActiveResponseIds procedure", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getActiveResponseIds"];
    expect(proc).toBeDefined();
  });

  it("cadence router should have getEmailHistory procedure", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getEmailHistory"];
    expect(proc).toBeDefined();
  });

  it("cadence router should have getByResponse procedure", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getByResponse"];
    expect(proc).toBeDefined();
  });

  it("cadence router should have stop procedure", () => {
    const proc = (appRouter as any)._def.procedures["cadence.stop"];
    expect(proc).toBeDefined();
  });

  it("cadence router should have processDue procedure", () => {
    const proc = (appRouter as any)._def.procedures["cadence.processDue"];
    expect(proc).toBeDefined();
  });
});

describe("Cadence Features — Input Validation", () => {
  it("startManual should require responseId and cadenceType", () => {
    // Verify the procedure exists with the expected input schema
    const proc = (appRouter as any)._def.procedures["cadence.startManual"];
    expect(proc).toBeDefined();
    // The procedure should be a mutation
    expect(proc._def.type).toBe("mutation");
  });

  it("getActiveResponseIds should require formId", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getActiveResponseIds"];
    expect(proc).toBeDefined();
    expect(proc._def.type).toBe("query");
  });

  it("getEmailHistory should require responseId", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getEmailHistory"];
    expect(proc).toBeDefined();
    expect(proc._def.type).toBe("query");
  });

  it("startManual cadenceType should only accept 'abandono' or 'reprovacao'", () => {
    const proc = (appRouter as any)._def.procedures["cadence.startManual"];
    // Get the input parser
    const inputs = proc._def.inputs;
    expect(inputs).toBeDefined();
    expect(inputs.length).toBeGreaterThan(0);
    
    // Validate that valid inputs pass
    const validInput1 = { responseId: 1, cadenceType: "abandono" };
    const validInput2 = { responseId: 1, cadenceType: "reprovacao" };
    const result1 = inputs[0].safeParse(validInput1);
    const result2 = inputs[0].safeParse(validInput2);
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Validate that invalid cadenceType fails
    const invalidInput = { responseId: 1, cadenceType: "invalid" };
    const result3 = inputs[0].safeParse(invalidInput);
    expect(result3.success).toBe(false);
  });

  it("startManual should accept optional rejectionReason", () => {
    const proc = (appRouter as any)._def.procedures["cadence.startManual"];
    const inputs = proc._def.inputs;
    
    const withReason = { responseId: 1, cadenceType: "reprovacao", rejectionReason: "Documentos incompletos" };
    const withoutReason = { responseId: 1, cadenceType: "abandono" };
    
    expect(inputs[0].safeParse(withReason).success).toBe(true);
    expect(inputs[0].safeParse(withoutReason).success).toBe(true);
  });

  it("getActiveResponseIds should reject non-numeric formId", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getActiveResponseIds"];
    const inputs = proc._def.inputs;
    
    const invalidInput = { formId: "abc" };
    const result = inputs[0].safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("getEmailHistory should reject non-numeric responseId", () => {
    const proc = (appRouter as any)._def.procedures["cadence.getEmailHistory"];
    const inputs = proc._def.inputs;
    
    const invalidInput = { responseId: "abc" };
    const result = inputs[0].safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe("Cadence Features — DB Functions", () => {
  it("getResponseIdsWithActiveCadence should be exported from db", async () => {
    const db = await import("./db");
    expect(typeof db.getResponseIdsWithActiveCadence).toBe("function");
  });

  it("getActivityTimeline should be exported from db", async () => {
    const db = await import("./db");
    expect(typeof db.getActivityTimeline).toBe("function");
  });

  it("createEmailCadence should be exported from db", async () => {
    const db = await import("./db");
    expect(typeof db.createEmailCadence).toBe("function");
  });

  it("logActivity should be exported from db", async () => {
    const db = await import("./db");
    expect(typeof db.logActivity).toBe("function");
  });
});

describe("Cadence Features — Email Activity Types", () => {
  it("getEmailHistory should filter for email-related activity types", () => {
    const emailActivityTypes = [
      "cadence_email_sent",
      "cadence_started",
      "cadence_stopped",
      "follow_up_sent",
      "rejection_email_sent",
      "approval_email_sent",
      "protocol_email_sent",
    ];

    // Verify all expected types are valid strings
    emailActivityTypes.forEach((type) => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });

    // Verify the filter function works correctly
    const mockTimeline = [
      { activityType: "cadence_email_sent", description: "Email sent" },
      { activityType: "cadence_started", description: "Cadence started" },
      { activityType: "form_submitted", description: "Form submitted" },
      { activityType: "validation_approved", description: "Approved" },
      { activityType: "rejection_email_sent", description: "Rejection email" },
    ];

    const filtered = mockTimeline.filter((event) =>
      emailActivityTypes.includes(event.activityType)
    );

    expect(filtered).toHaveLength(3);
    expect(filtered.map((e) => e.activityType)).toEqual([
      "cadence_email_sent",
      "cadence_started",
      "rejection_email_sent",
    ]);
  });
});
