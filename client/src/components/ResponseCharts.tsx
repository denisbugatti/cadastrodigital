/**
 * ResponseCharts — Analytics charts for the Responses page
 * - Pie chart: breakdown by a choice-based question (e.g., PF/PJ)
 * - Bar chart: responses per day over the last 14 days
 */

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, ChevronDown } from "lucide-react";

interface ResponseChartsProps {
  responses: any[];
  questions: any[];
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#818cf8", "#7c3aed", "#5b21b6", "#4f46e5",
  "#4338ca", "#3730a3", "#312e81", "#6d28d9",
];

export function ResponseCharts({ responses, questions }: ResponseChartsProps) {
  // Find choice-based questions for the pie chart selector
  const choiceQuestions = useMemo(() => {
    return questions.filter(
      (q: any) =>
        q.type === "multiple-choice" ||
        q.type === "multiple-select" ||
        q.type === "yes-no" ||
        q.type === "dropdown"
    );
  }, [questions]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    choiceQuestions[0]?.id ?? ""
  );

  // Pie chart data: breakdown by selected question
  const pieData = useMemo(() => {
    if (!selectedQuestionId || responses.length === 0) return [];

    const counts: Record<string, number> = {};
    responses.forEach((r: any) => {
      const answers = r.answers ?? {};
      const answer = answers[selectedQuestionId];
      if (answer === undefined || answer === null || answer === "") return;

      if (Array.isArray(answer)) {
        answer.forEach((a: string) => {
          // Try to find the choice label
          const q = questions.find((q: any) => q.id === selectedQuestionId);
          const choice = q?.choices?.find((c: any) => c.id === a || c.label === a);
          const label = choice?.label ?? a;
          counts[label] = (counts[label] || 0) + 1;
        });
      } else {
        const q = questions.find((q: any) => q.id === selectedQuestionId);
        let label: string;
        if (typeof answer === "boolean") {
          label = answer ? "Sim" : "Não";
        } else {
          const choice = q?.choices?.find(
            (c: any) => c.id === String(answer) || c.label === String(answer)
          );
          label = choice?.label ?? String(answer);
        }
        counts[label] = (counts[label] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [selectedQuestionId, responses, questions]);

  // Bar chart data: responses per day (last 14 days)
  const barData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();

    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days[key] = 0;
    }

    responses.forEach((r: any) => {
      const d = new Date(r.createdAt);
      const key = d.toISOString().split("T")[0];
      if (key in days) {
        days[key]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      count,
    }));
  }, [responses]);

  const selectedQuestion = questions.find(
    (q: any) => q.id === selectedQuestionId
  );

  if (responses.length === 0) return null;

  const totalPieResponses = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart Card */}
        {choiceQuestions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon size={16} className="text-brand" />
                <h3 className="text-sm font-semibold text-foreground">
                  Distribuição
                </h3>
              </div>
              {choiceQuestions.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="appearance-none bg-background border border-border rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 max-w-[180px] truncate"
                  >
                    {choiceQuestions.map((q: any) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
              )}
            </div>

            {selectedQuestion && (
              <p className="text-xs text-muted-foreground mb-3 truncate">
                {selectedQuestion.title}
              </p>
            )}

            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          padding: "8px 12px",
                        }}
                        formatter={(value: number) => [
                          `${value} (${((value / totalPieResponses) * 100).toFixed(0)}%)`,
                          "",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0 overflow-y-auto max-h-[160px]">
                  {pieData.map((entry, i) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-foreground truncate flex-1">
                        {entry.name}
                      </span>
                      <span className="text-muted-foreground font-mono shrink-0">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Sem dados para esta pergunta
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bar Chart Card */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-brand" />
            <h3 className="text-sm font-semibold text-foreground">
              Respostas por dia
            </h3>
            <span className="text-xs text-muted-foreground ml-auto">
              Últimos 14 dias
            </span>
          </div>

          <div className="h-[160px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={16}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number) => [`${value} respostas`, ""]}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
