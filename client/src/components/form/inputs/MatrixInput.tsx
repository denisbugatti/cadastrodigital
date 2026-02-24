/**
 * FormFlow — Dark Futuristic Design
 * Matrix input - rows x columns rating table.
 */

import { motion } from "framer-motion";

interface MatrixInputProps {
  rows: string[];
  columns: string[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function MatrixInput({ rows, columns, value, onChange }: MatrixInputProps) {
  const handleSelect = (row: string, col: string) => {
    onChange({ ...value, [row]: col });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="overflow-x-auto"
    >
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-3 text-xs font-body text-muted-foreground/50 uppercase tracking-wider" />
            {columns.map((col) => (
              <th key={col} className="p-3 text-center text-xs font-body text-muted-foreground/50 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <motion.tr
              key={row}
              className="border-t"
              style={{ borderColor: "oklch(0.3 0.02 260 / 0.2)" }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + ri * 0.05 }}
            >
              <td className="p-3 text-sm font-body text-foreground/70 min-w-[120px]">{row}</td>
              {columns.map((col) => {
                const isSelected = value[row] === col;
                return (
                  <td key={col} className="p-3 text-center">
                    <button
                      onClick={() => handleSelect(row, col)}
                      className="w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all duration-200"
                      style={isSelected ? {
                        background: "oklch(0.65 0.2 250)",
                        boxShadow: "0 0 12px oklch(0.65 0.2 250 / 0.4)",
                      } : {
                        background: "transparent",
                        border: "2px solid oklch(0.3 0.02 260 / 0.4)",
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        />
                      )}
                    </button>
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
