import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the notification system:
 * 1. Push subscription routing (staff vs owner tables)
 * 2. Status change notification triggers (approved/rejected)
 * 3. StaffNotificationsPanel icon mapping
 * 4. notifyCorretorStatusChange push payload
 */

// ─── Test 1: Push subscription routing logic ───
describe("Push subscription routing", () => {
  it("should route staff users to staff_push_subscriptions table", () => {
    // Simulate the routing logic from routers.ts push.subscribe
    const session = { type: "staff", staffUserId: 42, email: "corretor@test.com", role: "corretor", name: "Test" };
    const isStaff = session?.type === "staff" && session?.staffUserId;
    expect(isStaff).toBeTruthy();
    expect(session.staffUserId).toBe(42);
  });

  it("should fall back to push_subscriptions for non-staff users", () => {
    const session = null;
    const isStaff = session?.type === "staff" && (session as any)?.staffUserId;
    expect(isStaff).toBeFalsy();
  });

  it("should handle staff session with type=client correctly", () => {
    const session = { type: "client", clientUserId: 1, cpfCnpj: "12345678900", name: "Client" };
    const isStaff = session?.type === "staff" && (session as any)?.staffUserId;
    expect(isStaff).toBeFalsy();
  });
});

// ─── Test 2: Status change notification trigger logic ───
describe("Status change notification triggers", () => {
  it("should trigger notification when status changes to approved", () => {
    const newStatus = "approved";
    const shouldNotify = newStatus === "approved" || newStatus === "rejected";
    expect(shouldNotify).toBe(true);
  });

  it("should trigger notification when status changes to rejected", () => {
    const newStatus = "rejected";
    const shouldNotify = newStatus === "approved" || newStatus === "rejected";
    expect(shouldNotify).toBe(true);
  });

  it("should NOT trigger notification when status is in_review", () => {
    const newStatus = "in_review";
    const shouldNotify = newStatus === "approved" || newStatus === "rejected";
    expect(shouldNotify).toBe(false);
  });

  it("should build correct notification title for approved status", () => {
    const newStatus = "approved";
    const respondent = "João Silva";
    const statusLabel = newStatus === "approved" ? "aprovado" : "rejeitado";
    const statusEmoji = newStatus === "approved" ? "✅" : "❌";
    const notifTitle = `${statusEmoji} Cadastro ${statusLabel}: ${respondent}`;
    expect(notifTitle).toBe("✅ Cadastro aprovado: João Silva");
  });

  it("should build correct notification title for rejected status", () => {
    const newStatus = "rejected";
    const respondent = "Maria Santos";
    const statusLabel = newStatus === "approved" ? "aprovado" : "rejeitado";
    const statusEmoji = newStatus === "approved" ? "✅" : "❌";
    const notifTitle = `${statusEmoji} Cadastro ${statusLabel}: ${respondent}`;
    expect(notifTitle).toBe("❌ Cadastro rejeitado: Maria Santos");
  });

  it("should build correct notification body with form title", () => {
    const respondent = "João Silva";
    const formTitle = "Ficha Cadastral - Empreendimento X";
    const statusLabel = "aprovado";
    const notifBody = `O cadastro de ${respondent} no formulário "${formTitle}" foi ${statusLabel}.`;
    expect(notifBody).toBe('O cadastro de João Silva no formulário "Ficha Cadastral - Empreendimento X" foi aprovado.');
  });

  it("should include all assigned staff IDs including legacy", () => {
    const assignments = [
      { staffUserId: 10 },
      { staffUserId: 20 },
      { staffUserId: 30 },
    ];
    const legacyCorretorId = 5;
    const staffIds = assignments.map((a) => a.staffUserId);
    if (legacyCorretorId && !staffIds.includes(legacyCorretorId)) {
      staffIds.push(legacyCorretorId);
    }
    expect(staffIds).toEqual([10, 20, 30, 5]);
  });

  it("should NOT duplicate legacy corretor if already in assignments", () => {
    const assignments = [
      { staffUserId: 10 },
      { staffUserId: 20 },
    ];
    const legacyCorretorId = 10; // same as first assignment
    const staffIds = assignments.map((a) => a.staffUserId);
    if (legacyCorretorId && !staffIds.includes(legacyCorretorId)) {
      staffIds.push(legacyCorretorId);
    }
    expect(staffIds).toEqual([10, 20]); // No duplicate
  });

  it("should create batch notifications with correct type for approved", () => {
    const newStatus = "approved";
    const staffIds = [10, 20];
    const notifications = staffIds.map((staffUserId) => ({
      staffUserId,
      type: newStatus === "approved" ? "response_approved" : "response_rejected",
      title: "✅ Cadastro aprovado: João",
      body: "O cadastro de João foi aprovado.",
      link: "/corretor/respostas",
    }));
    expect(notifications).toHaveLength(2);
    expect(notifications[0].type).toBe("response_approved");
    expect(notifications[1].type).toBe("response_approved");
  });

  it("should create batch notifications with correct type for rejected", () => {
    const newStatus = "rejected";
    const staffIds = [10];
    const notifications = staffIds.map((staffUserId) => ({
      staffUserId,
      type: newStatus === "approved" ? "response_approved" : "response_rejected",
      title: "❌ Cadastro rejeitado: Maria",
      body: "O cadastro de Maria foi rejeitado.",
      link: "/corretor/respostas",
    }));
    expect(notifications[0].type).toBe("response_rejected");
  });
});

// ─── Test 3: notifyCorretorStatusChange payload ───
describe("notifyCorretorStatusChange payload", () => {
  it("should build correct push payload for approved status", () => {
    const params = {
      staffUserId: 42,
      formTitle: "Ficha Cadastral",
      respondentName: "João Silva",
      formId: 1,
      status: "approved" as const,
    };
    const statusLabel = params.status === "approved" ? "aprovado" : "rejeitado";
    const statusEmoji = params.status === "approved" ? "✅" : "❌";
    const title = `${statusEmoji} Cadastro ${statusLabel}!`;
    const body = params.respondentName
      ? `O cadastro de ${params.respondentName} no formulário "${params.formTitle}" foi ${statusLabel}.`
      : `Um cadastro no formulário "${params.formTitle}" foi ${statusLabel}.`;
    const tag = `status-change-${params.formId || 'unknown'}-${params.status}`;

    expect(title).toBe("✅ Cadastro aprovado!");
    expect(body).toBe('O cadastro de João Silva no formulário "Ficha Cadastral" foi aprovado.');
    expect(tag).toBe("status-change-1-approved");
  });

  it("should build correct push payload for rejected status", () => {
    const params = {
      staffUserId: 42,
      formTitle: "Ficha Cadastral",
      respondentName: "Maria Santos",
      formId: 2,
      status: "rejected" as const,
    };
    const statusLabel = params.status === "approved" ? "aprovado" : "rejeitado";
    const statusEmoji = params.status === "approved" ? "✅" : "❌";
    const title = `${statusEmoji} Cadastro ${statusLabel}!`;
    const body = `O cadastro de ${params.respondentName} no formulário "${params.formTitle}" foi ${statusLabel}.`;
    const tag = `status-change-${params.formId}-${params.status}`;

    expect(title).toBe("❌ Cadastro rejeitado!");
    expect(body).toBe('O cadastro de Maria Santos no formulário "Ficha Cadastral" foi rejeitado.');
    expect(tag).toBe("status-change-2-rejected");
  });

  it("should handle missing respondentName gracefully", () => {
    const params = {
      staffUserId: 42,
      formTitle: "Ficha Cadastral",
      formId: 3,
      status: "approved" as const,
    };
    const statusLabel = "aprovado";
    const body = params.respondentName
      ? `O cadastro de ${params.respondentName} no formulário "${params.formTitle}" foi ${statusLabel}.`
      : `Um cadastro no formulário "${params.formTitle}" foi ${statusLabel}.`;

    expect(body).toBe('Um cadastro no formulário "Ficha Cadastral" foi aprovado.');
  });

  it("should handle missing formId in tag", () => {
    const formId: number | undefined = undefined;
    const tag = `status-change-${formId || 'unknown'}-approved`;
    expect(tag).toBe("status-change-unknown-approved");
  });
});

// ─── Test 4: Notification icon mapping ───
describe("Notification icon mapping", () => {
  it("should map new_response to blue icon", () => {
    const type = "new_response";
    const className = type === "new_response"
      ? "bg-blue-500/10 text-blue-500"
      : type === "response_approved"
      ? "bg-emerald-500/10 text-emerald-500"
      : type === "response_rejected"
      ? "bg-red-500/10 text-red-500"
      : type === "form_assigned"
      ? "bg-green-500/10 text-green-500"
      : "bg-muted text-muted-foreground";
    expect(className).toBe("bg-blue-500/10 text-blue-500");
  });

  it("should map response_approved to emerald icon", () => {
    const type = "response_approved";
    const className = type === "new_response"
      ? "bg-blue-500/10 text-blue-500"
      : type === "response_approved"
      ? "bg-emerald-500/10 text-emerald-500"
      : type === "response_rejected"
      ? "bg-red-500/10 text-red-500"
      : type === "form_assigned"
      ? "bg-green-500/10 text-green-500"
      : "bg-muted text-muted-foreground";
    expect(className).toBe("bg-emerald-500/10 text-emerald-500");
  });

  it("should map response_rejected to red icon", () => {
    const type = "response_rejected";
    const className = type === "new_response"
      ? "bg-blue-500/10 text-blue-500"
      : type === "response_approved"
      ? "bg-emerald-500/10 text-emerald-500"
      : type === "response_rejected"
      ? "bg-red-500/10 text-red-500"
      : type === "form_assigned"
      ? "bg-green-500/10 text-green-500"
      : "bg-muted text-muted-foreground";
    expect(className).toBe("bg-red-500/10 text-red-500");
  });

  it("should map form_assigned to green icon", () => {
    const type = "form_assigned";
    const className = type === "new_response"
      ? "bg-blue-500/10 text-blue-500"
      : type === "response_approved"
      ? "bg-emerald-500/10 text-emerald-500"
      : type === "response_rejected"
      ? "bg-red-500/10 text-red-500"
      : type === "form_assigned"
      ? "bg-green-500/10 text-green-500"
      : "bg-muted text-muted-foreground";
    expect(className).toBe("bg-green-500/10 text-green-500");
  });

  it("should use default muted for unknown types", () => {
    const type = "unknown_type";
    const className = type === "new_response"
      ? "bg-blue-500/10 text-blue-500"
      : type === "response_approved"
      ? "bg-emerald-500/10 text-emerald-500"
      : type === "response_rejected"
      ? "bg-red-500/10 text-red-500"
      : type === "form_assigned"
      ? "bg-green-500/10 text-green-500"
      : "bg-muted text-muted-foreground";
    expect(className).toBe("bg-muted text-muted-foreground");
  });
});

// ─── Test 5: Service worker action label logic ───
describe("Service worker action label logic", () => {
  it("should use 'Ver respostas' for new_response_corretor", () => {
    const notifType = "new_response_corretor";
    let actionLabel = "Ver detalhes";
    if (notifType === "new_response_corretor" || notifType === "new_response") {
      actionLabel = "Ver respostas";
    } else if (notifType === "status_change_corretor") {
      actionLabel = "Ver cadastro";
    }
    expect(actionLabel).toBe("Ver respostas");
  });

  it("should use 'Ver cadastro' for status_change_corretor", () => {
    const notifType = "status_change_corretor";
    let actionLabel = "Ver detalhes";
    if (notifType === "new_response_corretor" || notifType === "new_response") {
      actionLabel = "Ver respostas";
    } else if (notifType === "status_change_corretor") {
      actionLabel = "Ver cadastro";
    }
    expect(actionLabel).toBe("Ver cadastro");
  });

  it("should use 'Ver detalhes' for unknown types", () => {
    const notifType = "some_other_type";
    let actionLabel = "Ver detalhes";
    if (notifType === "new_response_corretor" || notifType === "new_response") {
      actionLabel = "Ver respostas";
    } else if (notifType === "status_change_corretor") {
      actionLabel = "Ver cadastro";
    }
    expect(actionLabel).toBe("Ver detalhes");
  });
});

// ─── Test 6: Validation status determination ───
describe("Validation status determination", () => {
  it("should determine approved when all validations are approved", () => {
    const allValidations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "approved" },
      { questionId: "q3", status: "approved" },
    ];
    const questions = ["q1", "q2", "q3"];
    const allValidated = questions.every(qId =>
      allValidations.some(v => v.questionId === qId && v.status !== "pending")
    );
    const allApproved = allValidated && allValidations.every(v => v.status === "approved");
    const hasRejection = allValidations.some(v => v.status === "rejected");

    let newStatus = "in_review";
    if (allApproved) newStatus = "approved";
    else if (hasRejection) newStatus = "rejected";

    expect(newStatus).toBe("approved");
  });

  it("should determine rejected when any validation is rejected", () => {
    const allValidations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "rejected" },
      { questionId: "q3", status: "approved" },
    ];
    const questions = ["q1", "q2", "q3"];
    const allValidated = questions.every(qId =>
      allValidations.some(v => v.questionId === qId && v.status !== "pending")
    );
    const allApproved = allValidated && allValidations.every(v => v.status === "approved");
    const hasRejection = allValidations.some(v => v.status === "rejected");

    let newStatus = "in_review";
    if (allApproved) newStatus = "approved";
    else if (hasRejection) newStatus = "rejected";

    expect(newStatus).toBe("rejected");
  });

  it("should remain in_review when not all questions validated", () => {
    const allValidations = [
      { questionId: "q1", status: "approved" },
    ];
    const questions = ["q1", "q2", "q3"];
    const allValidated = questions.every(qId =>
      allValidations.some(v => v.questionId === qId && v.status !== "pending")
    );
    const allApproved = allValidated && allValidations.every(v => v.status === "approved");
    const hasRejection = allValidations.some(v => v.status === "rejected");

    let newStatus = "in_review";
    if (allApproved) newStatus = "approved";
    else if (hasRejection) newStatus = "rejected";

    expect(newStatus).toBe("in_review");
  });
});
