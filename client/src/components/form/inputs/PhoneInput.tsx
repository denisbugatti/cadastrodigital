/**
 * FormFlow Phone Input — With country flag selector + SMS Verification
 * Brazil is the default country. User can click the flag to change.
 * When smsVerification is enabled, shows a "Verificar" button that sends
 * an OTP code via SMS and requires the user to enter it before proceeding.
 * Inherits text color from parent. Works on any background.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ChevronDown, Search, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { countries, maskPhoneForCountry, type Country } from "@/lib/countries";
import { trpc } from "@/lib/trpc";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  smsVerification?: boolean;
  formId?: number;
}

type VerifyState = "idle" | "sending" | "code-sent" | "verifying" | "verified";

export function PhoneInput({ value, onChange, error, smsVerification, formId }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brazil default
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // SMS Verification state
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const sendCodeMutation = trpc.smsVerify.sendCode.useMutation();
  const checkCodeMutation = trpc.smsVerify.checkCode.useMutation();

  // Parse existing value to detect country on mount
  useEffect(() => {
    if (value) {
      if (value.startsWith("+")) {
        const match = countries.find((c) => value.startsWith(c.dialCode));
        if (match) {
          setSelectedCountry(match);
          const localPart = value.slice(match.dialCode.length);
          const masked = maskPhoneForCountry(localPart, match);
          if (masked !== value) {
            onChange(masked);
          }
        }
      }
    }
  }, []); // Only on mount

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus code input when code-sent
  useEffect(() => {
    if (verifyState === "code-sent") {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [verifyState]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const q = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
    const digits = value.replace(/\D/g, "");
    const masked = maskPhoneForCountry(digits, country);
    onChange(masked);
    // Reset verification when country changes
    if (verifyState !== "idle") {
      setVerifyState("idle");
      setOtpCode("");
      setVerifyError("");
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhoneForCountry(e.target.value, selectedCountry);
    onChange(masked);
    // Reset verification when phone changes
    if (verifyState === "verified" || verifyState === "code-sent") {
      setVerifyState("idle");
      setOtpCode("");
      setVerifyError("");
    }
  };

  // Get full E.164 phone number
  const getFullPhone = useCallback(() => {
    const digits = value.replace(/\D/g, "");
    return `${selectedCountry.dialCode}${digits}`;
  }, [value, selectedCountry]);

  // Check if phone number is long enough to verify
  const canSendCode = useMemo(() => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && cooldown === 0;
  }, [value, cooldown]);

  // Send verification code
  const handleSendCode = async () => {
    if (!formId || !canSendCode) return;
    setVerifyState("sending");
    setVerifyError("");

    try {
      await sendCodeMutation.mutateAsync({
        phone: getFullPhone(),
        formId,
      });
      setVerifyState("code-sent");
      setCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setVerifyError(err?.message || "Falha ao enviar código");
      setVerifyState("idle");
    }
  };

  // Check verification code
  const handleCheckCode = async () => {
    if (!formId || otpCode.length !== 6) return;
    setVerifyState("verifying");
    setVerifyError("");

    try {
      await checkCodeMutation.mutateAsync({
        phone: getFullPhone(),
        code: otpCode,
        formId,
      });
      setVerifyState("verified");
    } catch (err: any) {
      setVerifyError(err?.message || "Código inválido");
      setVerifyState("code-sent");
    }
  };

  const isVerified = verifyState === "verified";
  const showVerifyUI = smsVerification && formId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-end gap-3">
        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-3 sm:py-4 rounded-lg border transition-all duration-200 hover:opacity-80 shrink-0"
            style={{
              borderColor: "rgba(128,128,128,0.25)",
              backgroundColor: "rgba(128,128,128,0.06)",
            }}
          >
            <span className="text-xl leading-none">{selectedCountry.flag}</span>
            <span className="text-sm font-medium opacity-70" style={{ color: "inherit" }}>
              {selectedCountry.dialCode}
            </span>
            <ChevronDown
              size={14}
              className="opacity-40 transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 z-50 w-72 max-h-72 rounded-xl border shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: "rgba(20,20,20,0.97)",
                  borderColor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Search */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <Search size={14} className="text-white/40 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar país..."
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsOpen(false);
                        setSearchQuery("");
                      }
                    }}
                  />
                </div>

                {/* Country list */}
                <div className="overflow-y-auto max-h-56 custom-scrollbar">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-white/40">
                      Nenhum país encontrado
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 hover:bg-white/10"
                        style={{
                          backgroundColor:
                            country.code === selectedCountry.code
                              ? "rgba(112,190,250,0.15)"
                              : "transparent",
                        }}
                      >
                        <span className="text-lg leading-none">{country.flag}</span>
                        <span className="flex-1 text-sm text-white/80 truncate">
                          {country.name}
                        </span>
                        <span className="text-xs text-white/40 font-mono">
                          {country.dialCode}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone input */}
        <div className="flex-1">
          <div className="flex items-end gap-2">
            <input
              ref={inputRef}
              type="tel"
              value={value}
              onChange={handleInputChange}
              placeholder={selectedCountry.mask.replace(/0/g, "0")}
              maxLength={selectedCountry.mask.length + 5}
              disabled={isVerified}
              className="w-full bg-transparent border-0 border-b-2 py-3 sm:py-4 text-base sm:text-lg font-medium focus:outline-none transition-colors duration-300"
              style={{
                color: "inherit",
                borderColor: isVerified
                  ? "#22c55e"
                  : error
                    ? "#EF4444"
                    : value
                      ? "currentColor"
                      : "rgba(128,128,128,0.3)",
                opacity: isVerified ? 0.7 : 1,
              }}
              autoComplete="off"
            />
            {/* Verified badge inline */}
            {isVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0 pb-3 sm:pb-4"
              >
                <CheckCircle2 size={22} className="text-green-500" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* SMS Verification UI */}
      {showVerifyUI && !isVerified && (
        <AnimatePresence mode="wait">
          {verifyState === "idle" || verifyState === "sending" ? (
            <motion.div
              key="send-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3"
            >
              <button
                type="button"
                onClick={handleSendCode}
                disabled={!canSendCode || verifyState === "sending"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#93c5fd",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                {verifyState === "sending" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {verifyState === "sending"
                  ? "Enviando..."
                  : cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : "Verificar por SMS"}
              </button>
              <span className="text-xs opacity-40">
                Enviaremos um código de 6 dígitos
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="code-input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-60">
                  Código enviado para {selectedCountry.dialCode} {value}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(v);
                    setVerifyError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otpCode.length === 6) {
                      e.preventDefault();
                      handleCheckCode();
                    }
                  }}
                  placeholder="000000"
                  className="w-36 bg-transparent border-0 border-b-2 py-2 text-xl font-mono font-bold tracking-[0.3em] text-center focus:outline-none transition-colors duration-300"
                  style={{
                    color: "inherit",
                    borderColor: verifyError
                      ? "#EF4444"
                      : otpCode.length === 6
                        ? "currentColor"
                        : "rgba(128,128,128,0.3)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleCheckCode}
                  disabled={otpCode.length !== 6 || verifyState === "verifying"}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.15)",
                    color: "#86efac",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  }}
                >
                  {verifyState === "verifying" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  {verifyState === "verifying" ? "Verificando..." : "Confirmar"}
                </button>
              </div>

              {/* Resend link */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={cooldown > 0}
                  className="text-xs underline opacity-50 hover:opacity-80 transition-opacity disabled:opacity-20 disabled:no-underline"
                >
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyState("idle");
                    setOtpCode("");
                    setVerifyError("");
                  }}
                  className="text-xs underline opacity-50 hover:opacity-80 transition-opacity"
                >
                  Alterar número
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Verified success message */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#22c55e" }}
        >
          <CheckCircle2 size={16} />
          Número verificado com sucesso
        </motion.div>
      )}

      {/* Verify error */}
      {verifyError && (
        <motion.p
          className="text-sm text-red-400 font-medium"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {verifyError}
        </motion.p>
      )}

      <style>{`
        input[type="tel"]::placeholder {
          color: inherit;
          opacity: 0.25;
        }
      `}</style>

      {error && (
        <motion.p
          className="text-sm text-red-400 font-medium"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Only show "Press Enter" when not in SMS verification flow */}
      {(!showVerifyUI || isVerified) && (
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
      )}
    </motion.div>
  );
}
