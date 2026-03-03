import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the cadence management module.
 * Tests the data structures, filter logic, and status classification used
 * by the cadence management panel.
 */

// Helper: classify a cadence status based on active + nextSendAt
function classifyCadenceStatus(cadence: { active: boolean; nextSendAt: Date | null }): "active" | "paused" | "stopped" {
  if (!cadence.active) return "stopped";
  if (!cadence.nextSendAt) return "paused";
  return "active";
}

// Helper: compute progress percentage
function cadenceProgress(sequenceNumber: number, maxSequence: number): number {
  if (maxSequence <= 0) return 0;
  return Math.round((sequenceNumber / maxSequence) * 100);
}

// Helper: get stopped reason label
function getStoppedReasonLabel(reason: string | null): string {
  const labels: Record<string, string> = {
    completed: "Concluída",
    form_completed: "Cadastro completo",
    form_approved: "Cadastro aprovado",
    manual: "Encerrada manualmente",
    max_reached: "Limite atingido",
  };
  return labels[reason ?? ""] ?? "Encerrada";
}

// Helper: filter cadences by status
function filterByStatus(
  cadences: Array<{ active: boolean; nextSendAt: Date | null }>,
  status: "all" | "active" | "paused" | "stopped"
): typeof cadences {
  if (status === "all") return cadences;
  return cadences.filter((c) => classifyCadenceStatus(c) === status);
}

// Helper: filter cadences by type
function filterByType(
  cadences: Array<{ cadenceType: string }>,
  type: "all" | "abandono" | "reprovacao"
): typeof cadences {
  if (type === "all") return cadences;
  return cadences.filter((c) => c.cadenceType === type);
}

// Helper: search cadences by name or email
function searchCadences(
  cadences: Array<{ recipientName: string | null; recipientEmail: string }>,
  query: string
): typeof cadences {
  if (!query) return cadences;
  const lower = query.toLowerCase();
  return cadences.filter(
    (c) =>
      (c.recipientName?.toLowerCase().includes(lower)) ||
      c.recipientEmail.toLowerCase().includes(lower)
  );
}

// Helper: compute stats from cadences
function computeStats(cadences: Array<{ active: boolean; nextSendAt: Date | null; cadenceType: string }>) {
  let active = 0, paused = 0, stopped = 0, abandonoActive = 0, reprovacaoActive = 0;
  for (const c of cadences) {
    const status = classifyCadenceStatus(c);
    if (status === "active") {
      active++;
      if (c.cadenceType === "abandono") abandonoActive++;
      if (c.cadenceType === "reprovacao") reprovacaoActive++;
    } else if (status === "paused") {
      paused++;
    } else {
      stopped++;
    }
  }
  return { active, paused, stopped, total: cadences.length, abandonoActive, reprovacaoActive };
}

describe("Cadence Management — Status Classification", () => {
  it("should classify active cadence (active=true, nextSendAt set)", () => {
    expect(classifyCadenceStatus({ active: true, nextSendAt: new Date() })).toBe("active");
  });

  it("should classify paused cadence (active=true, nextSendAt null)", () => {
    expect(classifyCadenceStatus({ active: true, nextSendAt: null })).toBe("paused");
  });

  it("should classify stopped cadence (active=false)", () => {
    expect(classifyCadenceStatus({ active: false, nextSendAt: null })).toBe("stopped");
    expect(classifyCadenceStatus({ active: false, nextSendAt: new Date() })).toBe("stopped");
  });
});

describe("Cadence Management — Progress Calculation", () => {
  it("should return 0 for 0/24", () => {
    expect(cadenceProgress(0, 24)).toBe(0);
  });

  it("should return 50 for 12/24", () => {
    expect(cadenceProgress(12, 24)).toBe(50);
  });

  it("should return 100 for 24/24", () => {
    expect(cadenceProgress(24, 24)).toBe(100);
  });

  it("should return 0 for maxSequence=0", () => {
    expect(cadenceProgress(5, 0)).toBe(0);
  });

  it("should handle partial progress correctly", () => {
    expect(cadenceProgress(7, 24)).toBe(29);
    expect(cadenceProgress(1, 24)).toBe(4);
  });
});

describe("Cadence Management — Stopped Reason Labels", () => {
  it("should return correct label for known reasons", () => {
    expect(getStoppedReasonLabel("completed")).toBe("Concluída");
    expect(getStoppedReasonLabel("form_completed")).toBe("Cadastro completo");
    expect(getStoppedReasonLabel("form_approved")).toBe("Cadastro aprovado");
    expect(getStoppedReasonLabel("manual")).toBe("Encerrada manualmente");
    expect(getStoppedReasonLabel("max_reached")).toBe("Limite atingido");
  });

  it("should return fallback for unknown reason", () => {
    expect(getStoppedReasonLabel("unknown_reason")).toBe("Encerrada");
    expect(getStoppedReasonLabel(null)).toBe("Encerrada");
    expect(getStoppedReasonLabel("")).toBe("Encerrada");
  });
});

describe("Cadence Management — Filtering", () => {
  const sampleCadences = [
    { active: true, nextSendAt: new Date(), cadenceType: "abandono", recipientName: "João Silva", recipientEmail: "joao@test.com" },
    { active: true, nextSendAt: null, cadenceType: "reprovacao", recipientName: "Maria Santos", recipientEmail: "maria@test.com" },
    { active: false, nextSendAt: null, cadenceType: "abandono", recipientName: "Pedro Lima", recipientEmail: "pedro@test.com" },
    { active: true, nextSendAt: new Date(), cadenceType: "reprovacao", recipientName: "Ana Costa", recipientEmail: "ana@test.com" },
    { active: false, nextSendAt: null, cadenceType: "reprovacao", recipientName: null, recipientEmail: "unknown@test.com" },
  ];

  it("should return all cadences for status=all", () => {
    expect(filterByStatus(sampleCadences, "all")).toHaveLength(5);
  });

  it("should filter active cadences", () => {
    const active = filterByStatus(sampleCadences, "active");
    expect(active).toHaveLength(2);
    active.forEach((c) => {
      expect(c.active).toBe(true);
      expect(c.nextSendAt).not.toBeNull();
    });
  });

  it("should filter paused cadences", () => {
    const paused = filterByStatus(sampleCadences, "paused");
    expect(paused).toHaveLength(1);
    expect(paused[0].recipientName).toBe("Maria Santos");
  });

  it("should filter stopped cadences", () => {
    const stopped = filterByStatus(sampleCadences, "stopped");
    expect(stopped).toHaveLength(2);
    stopped.forEach((c) => expect(c.active).toBe(false));
  });

  it("should filter by type abandono", () => {
    const abandono = filterByType(sampleCadences, "abandono");
    expect(abandono).toHaveLength(2);
    abandono.forEach((c) => expect(c.cadenceType).toBe("abandono"));
  });

  it("should filter by type reprovacao", () => {
    const reprovacao = filterByType(sampleCadences, "reprovacao");
    expect(reprovacao).toHaveLength(3);
    reprovacao.forEach((c) => expect(c.cadenceType).toBe("reprovacao"));
  });

  it("should return all for type=all", () => {
    expect(filterByType(sampleCadences, "all")).toHaveLength(5);
  });
});

describe("Cadence Management — Search", () => {
  const sampleCadences = [
    { recipientName: "João Silva", recipientEmail: "joao@test.com" },
    { recipientName: "Maria Santos", recipientEmail: "maria@test.com" },
    { recipientName: null, recipientEmail: "unknown@example.com" },
  ];

  it("should find by name", () => {
    expect(searchCadences(sampleCadences, "João")).toHaveLength(1);
    expect(searchCadences(sampleCadences, "silva")).toHaveLength(1);
  });

  it("should find by email", () => {
    expect(searchCadences(sampleCadences, "maria@test")).toHaveLength(1);
    expect(searchCadences(sampleCadences, "example.com")).toHaveLength(1);
  });

  it("should return all for empty query", () => {
    expect(searchCadences(sampleCadences, "")).toHaveLength(3);
  });

  it("should return empty for no match", () => {
    expect(searchCadences(sampleCadences, "nonexistent")).toHaveLength(0);
  });

  it("should handle null recipientName gracefully", () => {
    expect(searchCadences(sampleCadences, "unknown")).toHaveLength(1);
  });

  it("should be case-insensitive", () => {
    expect(searchCadences(sampleCadences, "JOÃO")).toHaveLength(1);
    expect(searchCadences(sampleCadences, "MARIA")).toHaveLength(1);
  });
});

describe("Cadence Management — Stats Computation", () => {
  const sampleCadences = [
    { active: true, nextSendAt: new Date(), cadenceType: "abandono" },
    { active: true, nextSendAt: new Date(), cadenceType: "abandono" },
    { active: true, nextSendAt: null, cadenceType: "reprovacao" },
    { active: false, nextSendAt: null, cadenceType: "abandono" },
    { active: true, nextSendAt: new Date(), cadenceType: "reprovacao" },
  ];

  it("should compute correct totals", () => {
    const stats = computeStats(sampleCadences);
    expect(stats.total).toBe(5);
    expect(stats.active).toBe(3);
    expect(stats.paused).toBe(1);
    expect(stats.stopped).toBe(1);
  });

  it("should compute correct type breakdowns", () => {
    const stats = computeStats(sampleCadences);
    expect(stats.abandonoActive).toBe(2);
    expect(stats.reprovacaoActive).toBe(1);
  });

  it("should handle empty array", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.active).toBe(0);
    expect(stats.paused).toBe(0);
    expect(stats.stopped).toBe(0);
    expect(stats.abandonoActive).toBe(0);
    expect(stats.reprovacaoActive).toBe(0);
  });

  it("should handle all stopped", () => {
    const allStopped = [
      { active: false, nextSendAt: null, cadenceType: "abandono" },
      { active: false, nextSendAt: null, cadenceType: "reprovacao" },
    ];
    const stats = computeStats(allStopped);
    expect(stats.active).toBe(0);
    expect(stats.paused).toBe(0);
    expect(stats.stopped).toBe(2);
  });
});

describe("Cadence Management — Pagination Logic", () => {
  it("should calculate correct page ranges", () => {
    const total = 47;
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(3);

    // Page 1
    expect((1 - 1) * pageSize + 1).toBe(1);
    expect(Math.min(1 * pageSize, total)).toBe(20);

    // Page 2
    expect((2 - 1) * pageSize + 1).toBe(21);
    expect(Math.min(2 * pageSize, total)).toBe(40);

    // Page 3
    expect((3 - 1) * pageSize + 1).toBe(41);
    expect(Math.min(3 * pageSize, total)).toBe(47);
  });

  it("should handle single page", () => {
    const total = 5;
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(1);
  });

  it("should handle zero results", () => {
    const total = 0;
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(0);
  });
});
