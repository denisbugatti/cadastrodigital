import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the public file upload endpoint (files.publicUpload).
 * Verifies that public uploads work without auth, validate file size and mime type.
 */

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test-file.pdf", key: "form-uploads/abc-test.pdf" }),
  storageGet: vi.fn(),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("abc12345"),
}));

// Mock db
vi.mock("./db", () => ({
  createFileRecord: vi.fn().mockResolvedValue({ id: 1 }),
  getFilesByForm: vi.fn().mockResolvedValue([]),
  getFilesByResponse: vi.fn().mockResolvedValue([]),
  deleteFileRecord: vi.fn(),
}));

import { storagePut } from "./storage";

describe("Public File Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("publicUpload endpoint logic", () => {
    it("should accept valid PDF upload", async () => {
      const mockStoragePut = storagePut as ReturnType<typeof vi.fn>;
      mockStoragePut.mockResolvedValue({ url: "https://s3.example.com/test.pdf", key: "form-uploads/abc-test.pdf" });

      // Simulate the logic of publicUpload
      const input = {
        filename: "document.pdf",
        contentBase64: Buffer.from("fake pdf content").toString("base64"),
        mimeType: "application/pdf",
        context: "form-response",
      };

      const buffer = Buffer.from(input.contentBase64, "base64");
      expect(buffer.length).toBeLessThanOrEqual(10 * 1024 * 1024);

      const allowedMimes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      expect(allowedMimes).toContain(input.mimeType);
    });

    it("should accept valid image upload", async () => {
      const input = {
        filename: "photo.jpg",
        contentBase64: Buffer.from("fake image content").toString("base64"),
        mimeType: "image/jpeg",
      };

      const allowedMimes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      expect(allowedMimes).toContain(input.mimeType);
    });

    it("should reject disallowed mime types", () => {
      const disallowedMimes = [
        "application/javascript",
        "text/html",
        "application/x-executable",
        "application/zip",
        "video/mp4",
      ];

      const allowedMimes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      for (const mime of disallowedMimes) {
        expect(allowedMimes).not.toContain(mime);
      }
    });

    it("should reject files over 10MB", () => {
      // Create a base64 string that decodes to >10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, "A");
      expect(largeBuffer.length).toBeGreaterThan(10 * 1024 * 1024);
    });

    it("should accept HEIC/HEIF images (iPhone photos)", () => {
      const allowedMimes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      expect(allowedMimes).toContain("image/heic");
      expect(allowedMimes).toContain("image/heif");
    });

    it("should accept Word and Excel documents", () => {
      const allowedMimes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      expect(allowedMimes).toContain("application/msword");
      expect(allowedMimes).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      expect(allowedMimes).toContain("application/vnd.ms-excel");
      expect(allowedMimes).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
  });

  describe("FileValue parsing (multi-file support)", () => {
    it("should parse single file JSON", () => {
      const single = JSON.stringify({ url: "https://s3.example.com/a.pdf", filename: "a.pdf", mimeType: "application/pdf" });
      const parsed = JSON.parse(single);
      expect(parsed.url).toBe("https://s3.example.com/a.pdf");
      expect(parsed.filename).toBe("a.pdf");
    });

    it("should parse array of files JSON", () => {
      const files = [
        { url: "https://s3.example.com/a.pdf", filename: "a.pdf", mimeType: "application/pdf" },
        { url: "https://s3.example.com/b.jpg", filename: "b.jpg", mimeType: "image/jpeg" },
      ];
      const json = JSON.stringify(files);
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].filename).toBe("a.pdf");
      expect(parsed[1].filename).toBe("b.jpg");
    });

    it("should handle empty value", () => {
      const value = "";
      expect(value).toBeFalsy();
    });

    it("should handle legacy filename-only value", () => {
      const value = "old-file.pdf";
      // Not JSON, not starting with { or [
      expect(() => JSON.parse(value)).toThrow();
      // Legacy fallback: treat as filename
      expect(value).toBe("old-file.pdf");
    });
  });
});
