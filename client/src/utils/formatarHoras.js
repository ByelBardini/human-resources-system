/**
 * Converte horas decimais para formato hh:mm
 * @param {number} horas - Horas em formato decimal (ex: 8.5 = 8h30min)
 * @returns {string} Horas formatadas no formato hh:mm (ex: "08:30")
 */
export function formatarHorasParaHHMM(horas) {
  if (!horas && horas !== 0) return "00:00";
  if (horas === 0) return "00:00";
  
  const horasAbs = Math.abs(horas);
  const horasInteiras = Math.floor(horasAbs);
  const minutos = Math.round((horasAbs - horasInteiras) * 60);
  
  const horasStr = String(horasInteiras).padStart(2, "0");
  const minutosStr = String(minutos).padStart(2, "0");
  
  return `${horasStr}:${minutosStr}`;
}

/**
 * Converte horas decimais para formato hh:mm com sinal (para valores negativos)
 * @param {number} horas - Horas em formato decimal (ex: -8.5 = -8h30min)
 * @returns {string} Horas formatadas no formato +/-hh:mm (ex: "-08:30")
 */
export function formatarHorasComSinal(horas) {
  if (!horas && horas !== 0) return "00:00";
  if (horas === 0) return "00:00";
  
  const sinal = horas >= 0 ? "+" : "-";
  const horasFormatadas = formatarHorasParaHHMM(Math.abs(horas));
  
  return `${sinal}${horasFormatadas}`;
}
