/**
 * FormFlow — Dark Futuristic Design
 * Address input with automatic CEP lookup via ViaCEP API.
 * User types CEP → auto-fills street, neighborhood, city, state.
 * Only number and complement need manual input.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { maskCEP, lookupCEP, type AddressData } from "@/lib/validators";
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
    try {
      return JSON.parse(value || "{}");
    } catch {
      return { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => cepRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  // Serialize address to value
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
      setLoading(true);
      setFound(false);
      const data = await lookupCEP(cleaned);
      setLoading(false);
      if (data) {
        setFound(true);
        const filled = {
          ...newAddr,
          cep: masked,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        };
        updateValue(filled);
        // Focus on number field after auto-fill
        setTimeout(() => numberRef.current?.focus(), 300);
      }
    } else {
      setFound(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b py-3 text-base font-body text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors duration-300";
  const borderStyle = (val: string) => ({
    borderBottomColor: val ? "oklch(0.65 0.2 250 / 0.4)" : "oklch(0.3 0.02 260 / 0.3)",
    caretColor: "oklch(0.75 0.15 195)",
  });
  const labelClass = "text-[11px] font-body text-muted-foreground/50 uppercase tracking-wider mb-1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-5"
    >
      {/* CEP field */}
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
            className={inputClass}
            style={borderStyle(address.cep)}
            autoComplete="off"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {loading && <Loader2 size={18} className="animate-spin text-neon-blue" />}
            {found && !loading && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <CheckCircle2 size={18} style={{ color: "oklch(0.65 0.18 150)", filter: "drop-shadow(0 0 6px oklch(0.65 0.18 150 / 0.4))" }} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-filled fields */}
      {found && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4 }}
        >
          {/* Street (read-only) */}
          <div>
            <div className={labelClass}>Rua</div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-neon-cyan shrink-0" />
              <input
                type="text"
                value={address.street}
                readOnly
                className={`${inputClass} text-muted-foreground/70`}
                style={borderStyle(address.street)}
              />
            </div>
          </div>

          {/* Number + Complement (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={labelClass}>Número</div>
              <input
                ref={numberRef}
                type="text"
                value={address.number}
                onChange={(e) => updateValue({ ...address, number: e.target.value })}
                placeholder="Nº"
                className={inputClass}
                style={borderStyle(address.number)}
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
                className={inputClass}
                style={borderStyle(address.complement)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Neighborhood (read-only) */}
          <div>
            <div className={labelClass}>Bairro</div>
            <input
              type="text"
              value={address.neighborhood}
              readOnly
              className={`${inputClass} text-muted-foreground/70`}
              style={borderStyle(address.neighborhood)}
            />
          </div>

          {/* City + State (side by side, read-only) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className={labelClass}>Cidade</div>
              <input
                type="text"
                value={address.city}
                readOnly
                className={`${inputClass} text-muted-foreground/70`}
                style={borderStyle(address.city)}
              />
            </div>
            <div>
              <div className={labelClass}>Estado</div>
              <input
                type="text"
                value={address.state}
                readOnly
                className={`${inputClass} text-muted-foreground/70`}
                style={borderStyle(address.state)}
              />
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.p className="text-sm font-body" style={{ color: "oklch(0.6 0.22 25)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}
      <p className="text-xs text-muted-foreground/40 font-body">
        Digite o CEP e o endereço será preenchido automaticamente
      </p>
    </motion.div>
  );
}
