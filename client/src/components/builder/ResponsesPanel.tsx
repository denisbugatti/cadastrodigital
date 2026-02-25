/**
 * FormFlow Responses Panel — Full Dashboard
 * Tabela de respostas com filtros por data, busca, e exportação CSV/Excel.
 * Usa dados simulados (localStorage) já que não há backend.
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Share2, Download, Search, Calendar,
  ChevronDown, ChevronLeft, ChevronRight, Filter,
  Eye, Trash2, X, FileSpreadsheet, ArrowUpDown,
} from "lucide-react";
import type { BuilderQuestion } from "@/lib/builderTypes";

interface ResponsesPanelProps {
  formTitle: string;
  responseCount: number;
  questions?: BuilderQuestion[];
}

// Simulated response data
interface SimulatedResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, string>;
  status: "complete" | "partial";
}

function generateSampleResponses(questions: BuilderQuestion[]): SimulatedResponse[] {
  const actualQs = questions.filter(
    q => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"
  );
  if (actualQs.length === 0) return [];

  const names = [
    "Maria Silva", "João Santos", "Ana Oliveira", "Pedro Costa",
    "Juliana Lima", "Carlos Souza", "Fernanda Almeida", "Ricardo Pereira",
    "Beatriz Rodrigues", "Lucas Ferreira", "Camila Gomes", "Rafael Martins",
  ];
  const emails = names.map(n => n.toLowerCase().replace(" ", ".") + "@email.com");
  const cpfs = [
    "123.456.789-09", "987.654.321-00", "456.789.123-45", "321.654.987-12",
    "789.123.456-78", "654.987.321-34", "147.258.369-01", "963.852.741-56",
    "258.369.147-89", "741.852.963-23", "369.147.258-67", "852.963.741-90",
  ];
  const phones = [
    "(11) 99999-1234", "(21) 98888-5678", "(31) 97777-9012", "(41) 96666-3456",
    "(51) 95555-7890", "(61) 94444-2345", "(71) 93333-6789", "(81) 92222-0123",
    "(91) 91111-4567", "(11) 90000-8901", "(21) 99876-5432", "(31) 98765-4321",
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 14) + 8);
    date.setMinutes(Math.floor(Math.random() * 60));

    const answers: Record<string, string> = {};
    actualQs.forEach(q => {
      if (q.type === "name") answers[q.id] = names[i];
      else if (q.type === "email") answers[q.id] = emails[i];
      else if (q.type === "cpf") answers[q.id] = cpfs[i];
      else if (q.type === "phone") answers[q.id] = phones[i];
      else if (q.type === "multiple-choice" && q.choices.length > 0) {
        const choice = q.choices[Math.floor(Math.random() * q.choices.length)];
        answers[q.id] = choice.label;
      }
      else if (q.type === "date") {
        const d = new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        answers[q.id] = d.toLocaleDateString("pt-BR");
      }
      else if (q.type === "currency") answers[q.id] = `R$ ${(3000 + Math.floor(Math.random() * 20000)).toLocaleString("pt-BR")},00`;
      else if (q.type === "number") answers[q.id] = String(Math.floor(Math.random() * 100000000));
      else if (q.type === "short-text") answers[q.id] = ["Brasileiro(a)", "Engenheiro(a)", "Advogado(a)", "Médico(a)", "Professor(a)"][Math.floor(Math.random() * 5)];
      else if (q.type === "address") answers[q.id] = ["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR"][Math.floor(Math.random() * 4)];
      else if (q.type === "cnpj") answers[q.id] = "12.345.678/0001-90";
      else if (q.type === "file-upload") answers[q.id] = "arquivo.pdf";
      else answers[q.id] = "—";
    });

    return {
      id: `resp_${i + 1}`,
      submittedAt: date.toISOString(),
      answers,
      status: (Math.random() > 0.15 ? "complete" : "partial") as "complete" | "partial",
    };
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

type DateFilter = "all" | "today" | "7days" | "30days" | "custom";

/* ─── Pie Chart Component ─── */
function ResponsePieChart({ responses, questions }: { responses: SimulatedResponse[]; questions: BuilderQuestion[] }) {
  // Find the multiple-choice question that has PF/PJ
  const pfPjQ = questions.find(q => 
    q.type === "multiple-choice" && 
    q.choices.some(c => c.label.toLowerCase().includes("pessoa") || c.label.toLowerCase().includes("cpf") || c.label.toLowerCase().includes("cnpj"))
  );

  const data = useMemo(() => {
    if (!pfPjQ) {
      // Fallback: count complete vs partial
      const complete = responses.filter(r => r.status === "complete").length;
      const partial = responses.filter(r => r.status === "partial").length;
      return [
        { label: "Completas", value: complete, color: "#10B981" },
        { label: "Parciais", value: partial, color: "#F59E0B" },
      ];
    }
    // Count per choice
    const counts: Record<string, number> = {};
    pfPjQ.choices.forEach(c => { counts[c.label] = 0; });
    responses.forEach(r => {
      const answer = r.answers[pfPjQ.id];
      if (answer && counts[answer] !== undefined) counts[answer]++;
    });
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];
    return Object.entries(counts).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }));
  }, [responses, pfPjQ]);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  // SVG pie chart
  let cumulativeAngle = 0;
  const segments = data.map(d => {
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...d, startAngle, angle };
  });

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  return (
    <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {pfPjQ ? "Distribuição PF / PJ" : "Status das Respostas"}
      </p>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-20 h-20 shrink-0">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.angle >= 359.99
                ? `M 50 5 A 45 45 0 1 1 49.99 5 Z`
                : arcPath(50, 50, 45, seg.startAngle, seg.startAngle + seg.angle)
              }
              fill={seg.color}
              className="transition-all duration-300"
            />
          ))}
          <circle cx="50" cy="50" r="25" fill="white" />
          <text x="50" y="53" textAnchor="middle" className="text-[11px] font-bold fill-current">{total}</text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {data.map(d => (
            <div key={d.label} className="flex items-center gap-2 text-xs font-body">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-semibold text-foreground ml-auto">{d.value}</span>
              <span className="text-muted-foreground/50">({Math.round(d.value / total * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Bar Chart Component ─── */
function ResponseBarChart({ responses }: { responses: SimulatedResponse[] }) {
  const dailyData = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = new Date();
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      counts[key] = 0;
    }
    responses.forEach(r => {
      const d = new Date(r.submittedAt);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (counts[key] !== undefined) counts[key]++;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [responses]);

  const maxCount = Math.max(...dailyData.map(d => d.count), 1);

  return (
    <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Respostas por dia (últimos 7 dias)
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {dailyData.map(d => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t-md min-h-[2px]"
              style={{
                backgroundColor: d.count > 0 ? "#3B82F6" : "#E2E8F0",
                height: `${Math.max((d.count / maxCount) * 100, 3)}%`,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((d.count / maxCount) * 100, 3)}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <span className="text-[9px] font-body text-muted-foreground/60 leading-none">
              {d.date.split("/")[0]}/{d.date.split("/")[1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponsesPanel({ formTitle, responseCount: _rc, questions = [] }: ResponsesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("submittedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const actualQuestions = useMemo(
    () => questions.filter(q => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"),
    [questions]
  );

  const responses = useMemo(() => generateSampleResponses(questions), [questions]);

  // Columns to show in table (max 5 for readability + date)
  const visibleColumns = useMemo(() => {
    const cols = actualQuestions.slice(0, 5);
    return cols;
  }, [actualQuestions]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    let filtered = [...responses];

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter(r => {
        const d = new Date(r.submittedAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "7days") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.submittedAt) >= weekAgo);
    } else if (dateFilter === "30days") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.submittedAt) >= monthAgo);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        Object.values(r.answers).some(v => v.toLowerCase().includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortField === "submittedAt") {
        const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      const va = a.answers[sortField] || "";
      const vb = b.answers[sortField] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return filtered;
  }, [responses, dateFilter, searchQuery, sortField, sortDir]);

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ["Data", ...actualQuestions.map(q => q.title), "Status"];
    const rows = filteredResponses.map(r => [
      new Date(r.submittedAt).toLocaleString("pt-BR"),
      ...actualQuestions.map(q => r.answers[q.id] || ""),
      r.status === "complete" ? "Completo" : "Parcial",
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formTitle.replace(/\s+/g, "_")}_respostas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredResponses, actualQuestions, formTitle]);

  // Empty state
  if (actualQuestions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
            <ClipboardList size={44} className="text-brand/50" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-3">
            Este formulário ainda não tem perguntas.
          </h3>
          <p className="text-base text-muted-foreground mb-8">
            Adicione perguntas no Editor para começar a receber respostas.
          </p>
        </motion.div>
      </div>
    );
  }

  const selectedResp = selectedResponse ? responses.find(r => r.id === selectedResponse) : null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ─── Header with stats ─── */}
      <div className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Respostas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredResponses.length} resposta{filteredResponses.length !== 1 ? "s" : ""} encontrada{filteredResponses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium text-foreground border border-border hover:bg-secondary hover:border-brand/20 transition-all"
            >
              <FileSpreadsheet size={15} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total", value: responses.length, color: "text-brand" },
            { label: "Completas", value: responses.filter(r => r.status === "complete").length, color: "text-emerald-600" },
            { label: "Parciais", value: responses.filter(r => r.status === "partial").length, color: "text-amber-600" },
            { label: "Hoje", value: responses.filter(r => new Date(r.submittedAt).toDateString() === new Date().toDateString()).length, color: "text-blue-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-secondary/50 rounded-xl px-4 py-3 border border-border/50">
              <p className="text-xs font-body text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Charts ─── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Pie chart - PF vs PJ */}
          <ResponsePieChart responses={responses} questions={actualQuestions} />
          {/* Bar chart - Responses per day */}
          <ResponseBarChart responses={responses} />
        </div>

      {/* Filters row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar nas respostas..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm font-body bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand/30 transition-colors"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-all ${
                dateFilter !== "all"
                  ? "bg-brand-lighter text-brand border-brand/20"
                  : "text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              <Calendar size={14} />
              {dateFilter === "all" ? "Período" :
               dateFilter === "today" ? "Hoje" :
               dateFilter === "7days" ? "7 dias" : "30 dias"}
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-border shadow-xl z-50 py-1 min-w-[160px]"
                >
                  {([
                    ["all", "Todos os períodos"],
                    ["today", "Hoje"],
                    ["7days", "Últimos 7 dias"],
                    ["30days", "Últimos 30 dias"],
                  ] as [DateFilter, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setDateFilter(key); setShowDatePicker(false); setCurrentPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm font-body transition-colors ${
                        dateFilter === key ? "bg-brand-lighter text-brand font-medium" : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full">
          <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[160px]">
                <button onClick={() => handleSort("submittedAt")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Data
                  <ArrowUpDown size={11} className={sortField === "submittedAt" ? "text-brand" : ""} />
                </button>
              </th>
              {visibleColumns.map(q => (
                <th key={q.id} className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <button onClick={() => handleSort(q.id)} className="flex items-center gap-1 hover:text-foreground transition-colors max-w-[180px] truncate">
                    {q.title}
                    <ArrowUpDown size={11} className={`shrink-0 ${sortField === q.id ? "text-brand" : ""}`} />
                  </button>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[100px]">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[80px]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedResponses.map((resp, idx) => (
              <motion.tr
                key={resp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors group"
              >
                <td className="px-4 py-3 text-sm font-body text-muted-foreground whitespace-nowrap">
                  {new Date(resp.submittedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  <span className="ml-1 text-xs text-muted-foreground/50">
                    {new Date(resp.submittedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                {visibleColumns.map(q => (
                  <td key={q.id} className="px-4 py-3 text-sm font-body text-foreground max-w-[200px] truncate">
                    {resp.answers[q.id] || "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-medium ${
                    resp.status === "complete"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {resp.status === "complete" ? "Completo" : "Parcial"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedResponse(resp.id)}
                    className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-brand hover:bg-brand-lighter/50 transition-all opacity-0 group-hover:opacity-100"
                    title="Ver detalhes"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredResponses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter size={32} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm font-body text-muted-foreground">Nenhuma resposta encontrada com os filtros atuais.</p>
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-3 flex items-center justify-between shrink-0 bg-white">
          <p className="text-xs font-body text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredResponses.length)} de {filteredResponses.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-body font-medium transition-all ${
                  page === currentPage
                    ? "bg-brand text-white"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Response Detail Drawer ─── */}
      <AnimatePresence>
        {selectedResp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSelectedResponse(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-display font-bold text-foreground">Detalhes da Resposta</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedResp.submittedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-medium ${
                    selectedResp.status === "complete"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {selectedResp.status === "complete" ? "Resposta completa" : "Resposta parcial"}
                  </span>
                </div>

                {/* All answers */}
                {actualQuestions.map((q, i) => (
                  <div key={q.id} className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                    <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {i + 1}. {q.title}
                    </p>
                    <p className="text-sm font-body text-foreground">
                      {selectedResp.answers[q.id] || <span className="text-muted-foreground/40 italic">Não respondido</span>}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
