/**
 * FormFlow Date Picker Input — Custom calendar with year/month quick selector
 * Replaces native <input type="date"> to provide fast year navigation on mobile.
 * Adaptive colors: inherits text color from parent FormContainer.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

type ViewMode = "calendar" | "year" | "month";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePickerInput({ value, onChange, error }: DatePickerInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  // Parse initial date or use today
  const parsed = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [yearPageStart, setYearPageStart] = useState(Math.floor(parsed.year / 20) * 20);

  // Auto-open on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  const displayDate = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Selecione uma data";

  const handleSelectDay = useCallback((day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  }, [viewMonth, viewYear, onChange]);

  const handleSelectMonth = useCallback((month: number) => {
    setViewMonth(month);
    setViewMode("calendar");
  }, []);

  const handleSelectYear = useCallback((year: number) => {
    setViewYear(year);
    setViewMode("month");
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  // Year grid (20 years per page)
  const yearGrid = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 20; i++) years.push(yearPageStart + i);
    return years;
  }, [yearPageStart]);

  const selectedDay = parsed.day;
  const selectedMonth = parsed.month;
  const selectedYear = parsed.year;
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-3"
    >
      {/* Display / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left group cursor-pointer"
      >
        <CalendarIcon size={20} className="opacity-60 shrink-0" />
        <span
          className="w-full border-0 border-b-2 py-3 sm:py-4 text-lg sm:text-xl font-medium transition-colors duration-300"
          style={{
            color: "inherit",
            borderColor: error
              ? "#EF4444"
              : value
                ? "currentColor"
                : "rgba(128,128,128,0.3)",
            opacity: value ? 1 : 0.5,
          }}
        >
          {displayDate}
        </span>
      </button>

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "rgba(128,128,128,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              {viewMode === "calendar" && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("year")}
                    className="text-sm font-semibold px-3 py-1 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    {MONTHS_PT[viewMonth]} {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {viewMode === "year" && (
                <>
                  <button
                    type="button"
                    onClick={() => setYearPageStart((s) => s - 20)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-semibold">
                    {yearPageStart} — {yearPageStart + 19}
                  </span>
                  <button
                    type="button"
                    onClick={() => setYearPageStart((s) => s + 20)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {viewMode === "month" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setYearPageStart(Math.floor(viewYear / 20) * 20);
                      setViewMode("year");
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-semibold">
                    {viewYear}
                  </span>
                  <div className="w-8" />
                </>
              )}
            </div>

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <div className="px-2 pb-2">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAYS.map((day, i) => (
                    <div
                      key={i}
                      className="text-center text-[11px] font-medium py-1 select-none"
                      style={{ opacity: 0.4 }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const isSelected =
                      value &&
                      day === selectedDay &&
                      viewMonth === selectedMonth &&
                      viewYear === selectedYear;
                    const isToday =
                      day === todayDay &&
                      viewMonth === todayMonth &&
                      viewYear === todayYear;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        className="aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? "currentColor"
                            : "transparent",
                          opacity: isSelected ? 1 : undefined,
                        }}
                      >
                        <span
                          style={{
                            color: isSelected
                              ? "var(--date-picker-bg, rgba(0,0,0,0.9))"
                              : "inherit",
                            opacity: isSelected ? 1 : isToday ? 1 : 0.8,
                            fontWeight: isToday ? 700 : undefined,
                            textDecoration: isToday && !isSelected ? "underline" : undefined,
                          }}
                        >
                          {day}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Year View */}
            {viewMode === "year" && (
              <div className="px-2 pb-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {yearGrid.map((year) => {
                    const isSelected = value && year === selectedYear;
                    const isCurrent = year === todayYear;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleSelectYear(year)}
                        className="py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? "currentColor"
                            : "transparent",
                        }}
                      >
                        <span
                          style={{
                            color: isSelected
                              ? "var(--date-picker-bg, rgba(0,0,0,0.9))"
                              : "inherit",
                            opacity: isSelected ? 1 : isCurrent ? 1 : 0.7,
                            fontWeight: isCurrent ? 700 : undefined,
                            textDecoration: isCurrent && !isSelected ? "underline" : undefined,
                          }}
                        >
                          {year}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month View */}
            {viewMode === "month" && (
              <div className="px-2 pb-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS_SHORT.map((month, i) => {
                    const isSelected =
                      value && i === selectedMonth && viewYear === selectedYear;
                    const isCurrent =
                      i === todayMonth && viewYear === todayYear;
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleSelectMonth(i)}
                        className="py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? "currentColor"
                            : "transparent",
                        }}
                      >
                        <span
                          style={{
                            color: isSelected
                              ? "var(--date-picker-bg, rgba(0,0,0,0.9))"
                              : "inherit",
                            opacity: isSelected ? 1 : isCurrent ? 1 : 0.7,
                            fontWeight: isCurrent ? 700 : undefined,
                            textDecoration: isCurrent && !isSelected ? "underline" : undefined,
                          }}
                        >
                          {month}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-xs font-medium px-2 py-1 rounded transition-colors hover:bg-white/10 cursor-pointer"
                style={{ opacity: 0.5 }}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const m = String(now.getMonth() + 1).padStart(2, "0");
                  const d = String(now.getDate()).padStart(2, "0");
                  onChange(`${now.getFullYear()}-${m}-${d}`);
                  setIsOpen(false);
                }}
                className="text-xs font-medium px-2 py-1 rounded transition-colors hover:bg-white/10 cursor-pointer"
                style={{ opacity: 0.5 }}
              >
                Hoje
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
      <motion.p
        className="text-xs opacity-30 pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Pressione{" "}
        <kbd
          className="px-1.5 py-0.5 rounded border text-[10px] font-mono"
          style={{ borderColor: "rgba(128,128,128,0.3)" }}
        >
          Enter ↵
        </kbd>{" "}
        para continuar
      </motion.p>
    </motion.div>
  );
}
