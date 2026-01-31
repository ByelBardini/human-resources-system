const ZERO = "00:00";

/**
 * Converte horas decimais para formato hh:mm
 * @param {number} horas - Horas em formato decimal (ex: 8.5 = 8h30min)
 * @returns {string} Horas formatadas no formato hh:mm (ex: "08:30")
 */
export function formatarHorasParaHHMM(horas) {
  if (!horas && horas !== 0) return ZERO;
  if (horas === 0) return ZERO;

  const horasAbs = Math.abs(horas);
  const h = Math.floor(horasAbs);
  const m = Math.round((horasAbs - h) * 60);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Converte horas decimais para formato hh:mm com sinal (para valores negativos)
 * @param {number} horas - Horas em formato decimal (ex: -8.5 = -8h30min)
 * @returns {string} Horas formatadas no formato +/-hh:mm (ex: "-08:30")
 */
export function formatarHorasComSinal(horas) {
  if (!horas && horas !== 0) return ZERO;
  if (horas === 0) return ZERO;

  const sinal = horas >= 0 ? "+" : "-";
  return sinal + formatarHorasParaHHMM(Math.abs(horas));
}
