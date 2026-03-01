/**
 * FormFlow Address Input
 * Auto-fills via ViaCEP API. Adaptive colors for any background.
 * Clean, visible labels and values.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { maskCEP, lookupCEP } from "@/lib/validators";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface AddressState {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function AddressInput({ value, onChange, error }: AddressInputProps) {
  const cepRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(false);
  const [address, setAddress] = useState<AddressState>(() => {
    try { return JSON.parse(value || "{}"); }
    catch { return { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" }; }
  });

  useEffect(() => {
    const timer = setTimeout(() => cepRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const updateValue = (newAddr: AddressState) => {
    setAddress(newAddr);
    onChange(JSON.stringify(newAddr));
  };

  const handleCEPChange = async (raw: string) => {
    const masked = maskCEP(raw);
    const newAddr = { ...address, cep: masked };
    updateValue(newAddr);
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoading(true); setFound(false);
      const data = await lookupCEP(cleaned);
      setLoading(false);
      if (data) {
        setFound(true);
        const filled = { ...newAddr, cep: masked, street: data.logradouro || "", neighborhood: data.bairro || "", city: data.localidade || "", state: data.uf || "" };
        updateValue(filled);
        setTimeout(() => numberRef.current?.focus(), 300);
      }
    } else { setFound(false); }
  };

  // Adaptive styles — uses currentColor which inherits from parent (set by FormContainer)
  const inputClass = (val: string, readOnly?: boolean) =>
    `w-full bg-transparent border-0 border-b-2 py-3 sm:py-4 text-base sm:text-lg font-body focus:outline-none transition-colors duration-300 ${
      readOnly ? "opacity-80" : ""
    } ${val ? "border-current/30" : "border-current/15"}`;

  const labelClass = "text-xs font-body uppercase tracking-wider mb-2 font-semibold opacity-60";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="space-y-6">
      <div>
        <div className={labelClass}>CEP</div>
        <div className="relative">
          <input
            ref={cepRef}
            type="text"
            value={address.cep}
            onChange={(e) => handleCEPChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className={`${inputClass(address.cep)} placeholder:opacity-40`}
            style={{ color: "inherit" }}
            autoComplete="off"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {loading && <Loader2 size={20} className="animate-spin opacity-60" />}
            {found && !loading && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <CheckCircle2 size={20} className="text-emerald-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {found && (
        <motion.div className="space-y-6" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.4 }}>
          <div>
            <div className={labelClass}>Rua</div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="opacity-50 shrink-0" />
              <input
                type="text"
                value={address.street}
                readOnly
                className={inputClass(address.street, true)}
                style={{ color: "inherit" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className={labelClass}>Número</div>
              <input
                ref={numberRef}
                type="text"
                value={address.number}
                onChange={(e) => updateValue({ ...address, number: e.target.value })}
                placeholder="Nº"
                className={`${inputClass(address.number)} placeholder:opacity-40`}
                style={{ color: "inherit" }}
                autoComplete="off"
              />
            </div>
            <div>
              <div className={labelClass}>Complemento</div>
              <input
                type="text"
                value={address.complement}
                onChange={(e) => updateValue({ ...address, complement: e.target.value })}
                placeholder="Apto, Bloco..."
                className={`${inputClass(address.complement)} placeholder:opacity-40`}
                style={{ color: "inherit" }}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <div className={labelClass}>Bairro</div>
            <input
              type="text"
              value={address.neighborhood}
              readOnly
              className={inputClass(address.neighborhood, true)}
              style={{ color: "inherit" }}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className={labelClass}>Cidade</div>
              <input
                type="text"
                value={address.city}
                readOnly
                className={inputClass(address.city, true)}
                style={{ color: "inherit" }}
              />
            </div>
            <div>
              <div className={labelClass}>Estado</div>
              <input
                type="text"
                value={address.state}
                readOnly
                className={inputClass(address.state, true)}
                style={{ color: "inherit" }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {error && <motion.p className="text-sm font-body text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
      <p className="text-sm font-body opacity-50">Digite o CEP e o endereço será preenchido automaticamente</p>
    </motion.div>
  );
}
