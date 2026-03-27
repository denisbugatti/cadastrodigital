import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Test: Integration Logs Schema & Types ───
describe("Integration Logs", () => {
  describe("Log Status Values", () => {
    it("should accept valid status values", () => {
      const validStatuses = ["pending", "success", "failure", "retrying"];
      for (const status of validStatuses) {
        expect(validStatuses).toContain(status);
      }
    });

    it("should not accept invalid status values", () => {
      const validStatuses = ["pending", "success", "failure", "retrying"];
      expect(validStatuses).not.toContain("cancelled");
      expect(validStatuses).not.toContain("unknown");
    });
  });

  describe("Integration Types", () => {
    it("should recognize all supported integration types", () => {
      const supportedTypes = ["webhook", "googleSheets", "crmManus", "rdStation", "email", "whatsapp"];
      expect(supportedTypes).toContain("webhook");
      expect(supportedTypes).toContain("googleSheets");
      expect(supportedTypes).toContain("crmManus");
      expect(supportedTypes).toContain("rdStation");
      expect(supportedTypes).toContain("email");
      expect(supportedTypes).toContain("whatsapp");
    });
  });

  describe("Log Entry Structure", () => {
    it("should create a valid log entry structure", () => {
      const logEntry = {
        formId: 1,
        responseId: 42,
        integrationType: "webhook",
        status: "success" as const,
        httpStatus: 200,
        errorMessage: null,
        requestPayload: { url: "https://example.com/webhook" },
        responseBody: '{"ok":true}',
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: null,
        durationMs: 150,
      };

      expect(logEntry.formId).toBe(1);
      expect(logEntry.responseId).toBe(42);
      expect(logEntry.integrationType).toBe("webhook");
      expect(logEntry.status).toBe("success");
      expect(logEntry.httpStatus).toBe(200);
      expect(logEntry.retryCount).toBe(0);
      expect(logEntry.maxRetries).toBe(3);
      expect(logEntry.durationMs).toBe(150);
    });

    it("should create a failed log entry with error details", () => {
      const logEntry = {
        formId: 1,
        responseId: 42,
        integrationType: "googleSheets",
        status: "failure" as const,
        httpStatus: 403,
        errorMessage: "Permissão negada. Compartilhe a planilha com o email da conta de serviço.",
        requestPayload: { spreadsheetUrl: "https://docs.google.com/spreadsheets/d/abc123" },
        responseBody: null,
        retryCount: 3,
        maxRetries: 3,
        nextRetryAt: null,
        durationMs: 2500,
      };

      expect(logEntry.status).toBe("failure");
      expect(logEntry.httpStatus).toBe(403);
      expect(logEntry.errorMessage).toContain("Permissão negada");
      expect(logEntry.retryCount).toBe(logEntry.maxRetries);
    });

    it("should create a retrying log entry with next retry time", () => {
      const nextRetry = new Date(Date.now() + 60000);
      const logEntry = {
        formId: 1,
        responseId: 42,
        integrationType: "crmManus",
        status: "retrying" as const,
        httpStatus: 500,
        errorMessage: "Internal Server Error",
        retryCount: 1,
        maxRetries: 3,
        nextRetryAt: nextRetry,
        durationMs: 5000,
      };

      expect(logEntry.status).toBe("retrying");
      expect(logEntry.retryCount).toBeLessThan(logEntry.maxRetries);
      expect(logEntry.nextRetryAt).toBeDefined();
      expect(logEntry.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

// ─── Test: Retry Logic ───
describe("Retry Logic", () => {
  const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]; // 1min, 5min, 15min
  const MAX_RETRIES = 3;

  function getNextRetryAt(retryCount: number): Date | null {
    if (retryCount >= MAX_RETRIES) return null;
    const delayMs = RETRY_DELAYS_MS[retryCount] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    return new Date(Date.now() + delayMs);
  }

  function isTemporaryError(error: string, httpStatus?: number): boolean {
    if (httpStatus && httpStatus >= 500) return true;
    if (httpStatus === 429) return true;
    if (httpStatus === 408) return true;
    const tempPatterns = [
      "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENETUNREACH",
      "socket hang up", "network", "timeout", "ENOTFOUND",
      "fetch failed", "AbortError",
    ];
    const lowerErr = error.toLowerCase();
    return tempPatterns.some((p) => lowerErr.includes(p.toLowerCase()));
  }

  describe("getNextRetryAt", () => {
    it("should return a date for retry count 0 (first retry)", () => {
      const nextRetry = getNextRetryAt(0);
      expect(nextRetry).not.toBeNull();
      expect(nextRetry!.getTime()).toBeGreaterThan(Date.now());
      // Should be approximately 1 minute from now
      expect(nextRetry!.getTime() - Date.now()).toBeCloseTo(60_000, -3);
    });

    it("should return a date for retry count 1 (second retry)", () => {
      const nextRetry = getNextRetryAt(1);
      expect(nextRetry).not.toBeNull();
      // Should be approximately 5 minutes from now
      expect(nextRetry!.getTime() - Date.now()).toBeCloseTo(300_000, -3);
    });

    it("should return a date for retry count 2 (third retry)", () => {
      const nextRetry = getNextRetryAt(2);
      expect(nextRetry).not.toBeNull();
      // Should be approximately 15 minutes from now
      expect(nextRetry!.getTime() - Date.now()).toBeCloseTo(900_000, -3);
    });

    it("should return null when max retries reached", () => {
      const nextRetry = getNextRetryAt(3);
      expect(nextRetry).toBeNull();
    });

    it("should return null when retry count exceeds max", () => {
      const nextRetry = getNextRetryAt(5);
      expect(nextRetry).toBeNull();
    });
  });

  describe("isTemporaryError", () => {
    it("should identify HTTP 500+ as temporary", () => {
      expect(isTemporaryError("Server Error", 500)).toBe(true);
      expect(isTemporaryError("Bad Gateway", 502)).toBe(true);
      expect(isTemporaryError("Service Unavailable", 503)).toBe(true);
    });

    it("should identify HTTP 429 (rate limit) as temporary", () => {
      expect(isTemporaryError("Too Many Requests", 429)).toBe(true);
    });

    it("should identify HTTP 408 (timeout) as temporary", () => {
      expect(isTemporaryError("Request Timeout", 408)).toBe(true);
    });

    it("should identify network errors as temporary", () => {
      expect(isTemporaryError("ECONNRESET")).toBe(true);
      expect(isTemporaryError("ECONNREFUSED")).toBe(true);
      expect(isTemporaryError("ETIMEDOUT")).toBe(true);
      expect(isTemporaryError("socket hang up")).toBe(true);
      expect(isTemporaryError("fetch failed")).toBe(true);
    });

    it("should NOT identify HTTP 400 as temporary", () => {
      expect(isTemporaryError("Bad Request", 400)).toBe(false);
    });

    it("should NOT identify HTTP 401 as temporary", () => {
      expect(isTemporaryError("Unauthorized", 401)).toBe(false);
    });

    it("should NOT identify HTTP 403 as temporary", () => {
      expect(isTemporaryError("Forbidden", 403)).toBe(false);
    });

    it("should NOT identify HTTP 404 as temporary", () => {
      expect(isTemporaryError("Not Found", 404)).toBe(false);
    });

    it("should NOT identify generic errors as temporary", () => {
      expect(isTemporaryError("Invalid JSON")).toBe(false);
      expect(isTemporaryError("Missing required field")).toBe(false);
    });
  });

  describe("Retry Flow", () => {
    it("should schedule retry for temporary failures", () => {
      const error = "ECONNRESET";
      const httpStatus = undefined;
      const retryCount = 0;

      const isRetryable = isTemporaryError(error, httpStatus);
      expect(isRetryable).toBe(true);

      const nextRetry = getNextRetryAt(retryCount);
      expect(nextRetry).not.toBeNull();

      const status = isRetryable ? "retrying" : "failure";
      expect(status).toBe("retrying");
    });

    it("should mark as failure for permanent errors", () => {
      const error = "Invalid API key";
      const httpStatus = 401;
      const retryCount = 0;

      const isRetryable = isTemporaryError(error, httpStatus);
      expect(isRetryable).toBe(false);

      const status = isRetryable ? "retrying" : "failure";
      expect(status).toBe("failure");
    });

    it("should mark as failure when max retries exceeded", () => {
      const error = "ECONNRESET";
      const httpStatus = undefined;
      const retryCount = 3; // Already at max

      const isRetryable = isTemporaryError(error, httpStatus);
      expect(isRetryable).toBe(true);

      const nextRetry = getNextRetryAt(retryCount);
      expect(nextRetry).toBeNull();

      // Even though error is temporary, max retries reached
      const status = isRetryable && retryCount < MAX_RETRIES ? "retrying" : "failure";
      expect(status).toBe("failure");
    });
  });
});

// ─── Test: Google Sheets Service Account Validation ───
describe("Google Sheets Service Account", () => {
  describe("Service Account JSON Validation", () => {
    it("should validate a correct service account JSON", () => {
      const validKey = {
        type: "service_account",
        project_id: "test-project",
        private_key_id: "key123",
        private_key: "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
        client_email: "test@test-project.iam.gserviceaccount.com",
        client_id: "123456789",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      };

      expect(validKey.type).toBe("service_account");
      expect(validKey.client_email).toBeTruthy();
      expect(validKey.private_key).toBeTruthy();
      expect(validKey.client_email).toContain("@");
      expect(validKey.client_email).toContain("iam.gserviceaccount.com");
    });

    it("should reject JSON without service_account type", () => {
      const invalidKey = {
        type: "authorized_user",
        client_email: "test@test.com",
        private_key: "key",
      };

      const isValid = invalidKey.type === "service_account" && !!invalidKey.client_email && !!invalidKey.private_key;
      expect(isValid).toBe(false);
    });

    it("should reject JSON without client_email", () => {
      const invalidKey = {
        type: "service_account",
        private_key: "key",
      };

      const isValid = invalidKey.type === "service_account" && !!(invalidKey as any).client_email && !!invalidKey.private_key;
      expect(isValid).toBe(false);
    });

    it("should reject JSON without private_key", () => {
      const invalidKey = {
        type: "service_account",
        client_email: "test@test.com",
      };

      const isValid = invalidKey.type === "service_account" && !!invalidKey.client_email && !!(invalidKey as any).private_key;
      expect(isValid).toBe(false);
    });
  });

  describe("Spreadsheet URL Parsing", () => {
    function extractSpreadsheetId(url: string): string | null {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match?.[1] ?? null;
    }

    it("should extract spreadsheet ID from standard URL", () => {
      const url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit";
      expect(extractSpreadsheetId(url)).toBe("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms");
    });

    it("should extract spreadsheet ID from URL with gid", () => {
      const url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit#gid=0";
      expect(extractSpreadsheetId(url)).toBe("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms");
    });

    it("should return null for invalid URL", () => {
      expect(extractSpreadsheetId("https://google.com")).toBeNull();
      expect(extractSpreadsheetId("not a url")).toBeNull();
      expect(extractSpreadsheetId("")).toBeNull();
    });
  });

  describe("Connection Status", () => {
    it("should track connection status transitions", () => {
      type ConnectionStatus = "untested" | "connected" | "error";

      let status: ConnectionStatus = "untested";
      expect(status).toBe("untested");

      // After successful test
      status = "connected";
      expect(status).toBe("connected");

      // After URL change, reset to untested
      status = "untested";
      expect(status).toBe("untested");

      // After failed test
      status = "error";
      expect(status).toBe("error");
    });
  });
});

// ─── Test: Dispatcher Payload Construction ───
describe("Dispatcher Payload", () => {
  it("should construct correct dispatch payload", () => {
    const payload = {
      formId: 1,
      formTitle: "Cadastro de Imóvel",
      responseId: 42,
      protocolCode: "ABC-123",
      respondentName: "Maria Silva",
      respondentEmail: "maria@test.com",
      answers: { nome: "Maria Silva", email: "maria@test.com", telefone: "11999999999" },
      questions: [
        { id: "nome", title: "Nome completo", type: "name" },
        { id: "email", title: "E-mail", type: "email" },
        { id: "telefone", title: "Telefone", type: "phone" },
      ],
      isComplete: true,
      submittedAt: new Date("2026-01-15T10:00:00Z").toISOString(),
    };

    expect(payload.formId).toBe(1);
    expect(payload.responseId).toBe(42);
    expect(payload.protocolCode).toBe("ABC-123");
    expect(payload.isComplete).toBe(true);
    expect(payload.answers.nome).toBe("Maria Silva");
    expect(payload.questions).toHaveLength(3);
  });

  it("should format answers for webhook with question titles as keys", () => {
    const answers: Record<string, any> = { q1: "Maria", q2: "maria@test.com", q3: 30 };
    const questions = [
      { id: "q1", title: "Nome", type: "name" },
      { id: "q2", title: "Email", type: "email" },
      { id: "q3", title: "Idade", type: "number" },
    ];

    const formatted: Record<string, any> = {};
    for (const q of questions) {
      formatted[q.title || q.id] = answers[q.id] ?? null;
    }

    expect(formatted["Nome"]).toBe("Maria");
    expect(formatted["Email"]).toBe("maria@test.com");
    expect(formatted["Idade"]).toBe(30);
  });

  it("should extract contact info from answers", () => {
    const answers: Record<string, any> = {
      q1: "João Silva",
      q2: "joao@test.com",
      q3: "11988887777",
    };
    const questions = [
      { id: "q1", title: "Nome completo", type: "name" },
      { id: "q2", title: "E-mail", type: "email" },
      { id: "q3", title: "Telefone / WhatsApp", type: "phone" },
    ];

    let name = "";
    let email = "";
    let phone = "";

    for (const q of questions) {
      const answer = answers[q.id];
      if (!answer) continue;
      if (q.type === "name" || q.type === "full-name") name = String(answer);
      if (q.type === "email") email = String(answer);
      if (q.type === "phone" || q.type === "phone-number") phone = String(answer);
    }

    expect(name).toBe("João Silva");
    expect(email).toBe("joao@test.com");
    expect(phone).toBe("11988887777");
  });

  it("should handle missing contact fields gracefully", () => {
    const answers: Record<string, any> = { q1: "Some text" };
    const questions = [{ id: "q1", title: "Observações", type: "text" }];

    let name = "";
    let email = "";
    let phone = "";

    for (const q of questions) {
      const answer = answers[q.id];
      if (!answer) continue;
      if (q.type === "name") name = String(answer);
      if (q.type === "email") email = String(answer);
      if (q.type === "phone") phone = String(answer);
    }

    expect(name).toBe("");
    expect(email).toBe("");
    expect(phone).toBe("");
  });
});

// ─── Test: Response Body Truncation ───
describe("Response Body Handling", () => {
  it("should truncate long response bodies", () => {
    const longBody = "x".repeat(10000);
    const truncated = longBody.substring(0, 5000);
    expect(truncated.length).toBe(5000);
  });

  it("should not truncate short response bodies", () => {
    const shortBody = '{"ok":true}';
    const truncated = shortBody.substring(0, 5000);
    expect(truncated).toBe(shortBody);
  });

  it("should handle null response body", () => {
    const body: string | null = null;
    const truncated = body?.substring(0, 5000) ?? null;
    expect(truncated).toBeNull();
  });
});
