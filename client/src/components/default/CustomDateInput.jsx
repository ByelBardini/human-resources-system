import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { ChevronDown, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parse, isValid } from "date-fns";
import { pt } from "date-fns/locale";
import "react-day-picker/style.css";

/**
 * Input de data com calendário customizado.
 * value e onChange usam formato YYYY-MM-DD (igual input type="date").
 */
export default function CustomDateInput({
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = "Selecione a data",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const date = value && isValid(parse(value, "yyyy-MM-dd", new Date()))
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const displayText = date ? format(date, "dd/MM/yyyy", { locale: pt }) : "";

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(selectedDate) {
    if (selectedDate) {
      onChange({ target: { value: format(selectedDate, "yyyy-MM-dd") } });
      setOpen(false);
    }
  }

  const minDate = min ? parse(min, "yyyy-MM-dd", new Date()) : undefined;
  const maxDate = max ? parse(max, "yyyy-MM-dd", new Date()) : undefined;
  const disabledMatchers = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
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
        <span className={`flex items-center gap-2 ${!displayText ? "text-white/50" : "text-white"}`}>
          <Calendar size={18} className="text-white/60 shrink-0" />
          {displayText || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-white/60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 left-0
                       rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl
                       shadow-xl shadow-black/30 p-4 rdp-datepicker"
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleSelect}
              locale={ptBR}
              disabled={disabledMatchers.length ? disabledMatchers : undefined}
              defaultMonth={date || new Date()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
