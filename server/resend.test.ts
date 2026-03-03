import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key validation", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey!.startsWith("re_")).toBe(true);
  });

  it("should be able to initialize Resend client and send email", async () => {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    expect(resend).toBeDefined();

    // Send a test email using the verified domain
    const { data, error } = await resend.emails.send({
      from: "Cadastro Digital <one@cadastrodigital.com.br>",
      to: ["denisbugatti@icloud.com"],
      subject: "Teste - Cadastro Digital",
      html: "<p>Este é um email de teste do sistema Cadastro Digital. A integração com Resend está funcionando!</p>",
    });

    // The key should be valid for sending
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeDefined();
    console.log(`[Resend Test] Email sent successfully, id: ${data!.id}`);
  }, 15000);
});
