/**
 * FormFlow Phone Input — With country flag selector
 * Brazil is the default country. User can click the flag to change.
 * Inherits text color from parent. Works on any background.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countries, maskPhoneForCountry, type Country } from "@/lib/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brazil default
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Parse existing value to detect country on mount
  useEffect(() => {
    if (value) {
      // If value starts with +, try to detect country
      if (value.startsWith("+")) {
        const match = countries.find((c) => value.startsWith(c.dialCode));
        if (match) {
          setSelectedCountry(match);
          // Strip dial code from value for local display
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
    // Re-mask the current value with the new country format
    const digits = value.replace(/\D/g, "");
    const masked = maskPhoneForCountry(digits, country);
    onChange(masked);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhoneForCountry(e.target.value, selectedCountry);
    onChange(masked);
  };

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
          <input
            ref={inputRef}
            type="tel"
            value={value}
            onChange={handleInputChange}
            placeholder={selectedCountry.mask.replace(/0/g, "0")}
            maxLength={selectedCountry.mask.length + 5}
            className="w-full bg-transparent border-0 border-b-2 py-3 sm:py-4 text-base sm:text-lg font-medium focus:outline-none transition-colors duration-300"
            style={{
              color: "inherit",
              borderColor: error
                ? "#EF4444"
                : value
                  ? "currentColor"
                  : "rgba(128,128,128,0.3)",
            }}
            autoComplete="off"
          />
        </div>
      </div>

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
