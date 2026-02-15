import { useState, useEffect, useCallback, useRef } from "react";
import { Calculator } from "lucide-react";
import Background from "../components/default/Background.jsx";

const MAX_DIGITS = 8;

// Buffer de dígitos → string "HH:MM" (display rolante)
function bufferToDisplay(buffer) {
  if (!buffer || buffer.length === 0) return "00:00";
  const minutes = buffer.length <= 2
    ? buffer.padStart(2, "0")
    : buffer.slice(-2);
  const hoursStr = buffer.length <= 2 ? "" : buffer.slice(0, -2);
  const hoursPart = buffer.length <= 2
    ? "00"
    : hoursStr.length <= 2
      ? hoursStr.padStart(2, "0")
      : hoursStr;
  return `${hoursPart}:${minutes}`;
}

// Buffer de dígitos → total em minutos (para +/-)
function bufferToMinutes(buffer) {
  if (!buffer || buffer.length === 0) return 0;
  const minutes = buffer.length <= 2
    ? parseInt(buffer.padStart(2, "0"), 10)
    : parseInt(buffer.slice(-2), 10);
  const hours = buffer.length <= 2
    ? 0
    : parseInt(buffer.slice(0, -2), 10);
  return hours * 60 + minutes;
}

// Total em minutos → string "HH:MM" ou "-HH:MM"
function formatTotal(totalMinutes) {
  if (totalMinutes === null || Number.isNaN(totalMinutes)) return "00:00";
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  const sign = totalMinutes < 0 ? "-" : "";
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function CalculadoraHoras() {
  const [digitBuffer, setDigitBuffer] = useState("");
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [showingResult, setShowingResult] = useState(false);
  const [lastOp, setLastOp] = useState(null); // "+" | "-" | null
  const showingResultRef = useRef(false);
  useEffect(() => {
    showingResultRef.current = showingResult;
  }, [showingResult]);

  const displayValue = showingResult
    ? formatTotal(totalMinutes)
    : bufferToDisplay(digitBuffer);

  const onDigit = useCallback((d) => {
    if (showingResultRef.current) setLastOp(null);
    setShowingResult(false);
    setDigitBuffer((prev) => {
      if (prev.length >= MAX_DIGITS) return prev;
      return prev + d;
    });
  }, []);

  const onBackspace = useCallback(() => {
    setShowingResult(false);
    setDigitBuffer((prev) => prev.slice(0, -1));
  }, []);

  const onClear = useCallback(() => {
    setDigitBuffer("");
    setTotalMinutes(0);
    setShowingResult(false);
    setLastOp(null);
  }, []);

  const onPlus = useCallback(() => {
    const bufMin = bufferToMinutes(digitBuffer);
    setTotalMinutes((prev) => {
      if (prev === 0 && lastOp === null) return bufMin;
      return prev + bufMin;
    });
    setDigitBuffer("");
    setShowingResult(false);
    setLastOp("+");
  }, [digitBuffer, lastOp]);

  const onMinus = useCallback(() => {
    const bufMin = bufferToMinutes(digitBuffer);
    setTotalMinutes((prev) => {
      if (digitBuffer.length > 0) {
        if (prev === 0 && lastOp === null) return bufMin;
        return prev - bufMin;
      }
      return prev;
    });
    setDigitBuffer("");
    setShowingResult(false);
    setLastOp("-");
  }, [digitBuffer, lastOp]);

  const onEquals = useCallback(() => {
    const bufMin = bufferToMinutes(digitBuffer);
    setTotalMinutes((prev) => {
      if (lastOp === "+") return prev + bufMin;
      if (lastOp === "-") return prev - bufMin;
      return bufMin;
    });
    setDigitBuffer("");
    setShowingResult(true);
  }, [digitBuffer, lastOp]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        onDigit(e.key);
        return;
      }
      if (e.key === "+") {
        e.preventDefault();
        onPlus();
        return;
      }
      if (e.key === "-") {
        e.preventDefault();
        onMinus();
        return;
      }
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        onEquals();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClear();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDigit, onPlus, onMinus, onEquals, onBackspace, onClear]);

  const btnBase =
    "rounded-xl border border-white/20 font-semibold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30";

  return (
    <div className="relative min-h-[100dvh] w-full flex justify-center items-center p-4 overflow-hidden">
      <Background />
      <div className="relative z-10 w-full max-w-sm bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator size={24} />
          Calculadora de horas
        </h1>

        {/* Total */}
        <div className="text-white/70 text-sm mb-2">
          Total: <span className="text-white font-medium">{formatTotal(totalMinutes)}</span>
        </div>

        {/* Display principal (somente leitura) */}
        <div
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-4 text-right text-2xl font-mono font-semibold text-white tabular-nums"
          aria-live="polite"
        >
          {displayValue}
        </div>

        {/* Teclado: 7 8 9 + | 4 5 6 - | 1 2 3 C | 0 ⌫ */}
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={() => onDigit("7")} className={`${btnBase} bg-white/10 text-white py-3`}>7</button>
          <button type="button" onClick={() => onDigit("8")} className={`${btnBase} bg-white/10 text-white py-3`}>8</button>
          <button type="button" onClick={() => onDigit("9")} className={`${btnBase} bg-white/10 text-white py-3`}>9</button>
          <button type="button" onClick={onPlus} className={`${btnBase} bg-blue-500/30 text-blue-300 py-3`}>+</button>

          <button type="button" onClick={() => onDigit("4")} className={`${btnBase} bg-white/10 text-white py-3`}>4</button>
          <button type="button" onClick={() => onDigit("5")} className={`${btnBase} bg-white/10 text-white py-3`}>5</button>
          <button type="button" onClick={() => onDigit("6")} className={`${btnBase} bg-white/10 text-white py-3`}>6</button>
          <button type="button" onClick={onMinus} className={`${btnBase} bg-blue-500/30 text-blue-300 py-3`}>−</button>

          <button type="button" onClick={() => onDigit("1")} className={`${btnBase} bg-white/10 text-white py-3`}>1</button>
          <button type="button" onClick={() => onDigit("2")} className={`${btnBase} bg-white/10 text-white py-3`}>2</button>
          <button type="button" onClick={() => onDigit("3")} className={`${btnBase} bg-white/10 text-white py-3`}>3</button>
          <button type="button" onClick={onClear} className={`${btnBase} bg-white/20 text-white py-3`}>C</button>

          <button type="button" onClick={() => onDigit("0")} className={`${btnBase} bg-white/10 text-white py-3`}>0</button>
          <button type="button" onClick={onBackspace} className={`${btnBase} bg-white/20 text-white py-3`} title="Apagar">⌫</button>
          <button type="button" onClick={onEquals} className={`${btnBase} bg-green-500/30 text-green-300 py-3 col-span-2`} title="Calcular">=</button>
        </div>

        <p className="text-white/50 text-xs mt-4 text-center">
          Use o teclado: 0-9, +, -, Enter ou = (calcular), Backspace, Esc (limpar)
        </p>
      </div>
    </div>
  );
}

export default CalculadoraHoras;
