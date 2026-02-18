import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

/**
 * Select customizado com dropdown estilizado.
 * API compatível com select nativo: value, onChange, children (option), disabled.
 */
export default function CustomSelect({ value, onChange, children, disabled, className = "", dropUp = false }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const options = [];
  React.Children.forEach(children, (child) => {
    if (child?.type === "option" && child.props !== undefined) {
      const { value: val, children: label, hidden } = child.props;
      options.push({ value: val, label, hidden });
    }
  });

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected?.label ?? "";

  useEffect(() => {
    function handleClickOutside(e) {
      const inContainer = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inContainer && !inDropdown) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 224; // max-h-56 = 14rem = 224px
      
      // Decide se abre pra cima ou pra baixo baseado no espaço disponível
      const shouldDropUp = dropUp || (spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
      
      setPosition({
        top: shouldDropUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        dropUp: shouldDropUp
      });
    }
  }, [open, dropUp]);

  function handleSelect(optionValue) {
    onChange({ target: { value: optionValue } });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2.5 rounded-xl text-left text-[0.9375rem]
          bg-white/10 border border-white/20
          hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/35
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
        `}
      >
        <span className={!displayLabel ? "text-white/50" : "text-white"}>
          {displayLabel || "Selecione..."}
        </span>
        <ChevronDown
          size={18}
          className={`text-white/60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: position.dropUp ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position.dropUp ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: position.dropUp ? 'auto' : position.top,
              bottom: position.dropUp ? window.innerHeight - position.top : 'auto',
              left: position.left,
              width: position.width,
            }}
            className={`z-[9999] min-w-[140px] max-h-56 overflow-y-auto custom-select-dropdown
                       rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl
                       shadow-xl shadow-black/30 py-1`}
          >
            {options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value ?? idx}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm
                    transition-colors duration-100
                    ${isSelected
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
