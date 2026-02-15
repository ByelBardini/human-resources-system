/**
 * Funções utilitárias de formatação centralizadas.
 * Evita duplicação de código em todo o projeto.
 */

// ==================== DATAS ====================

/**
 * Formata data para exibição curta (DD/MM)
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada (ex: "15/02")
 */
export function formatarDataCurta(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata data para exibição completa (DD/MM/YYYY)
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada (ex: "15/02/2026")
 */
export function formatarData(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata data com dia da semana e mês por extenso
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada (ex: "segunda-feira, 15 de fevereiro de 2026")
 */
export function formatarDataCompleta(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata data com dia da semana por extenso (sem ano)
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada (ex: "segunda-feira, 15 de fevereiro")
 */
export function formatarDataComDiaSemana(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Obtém abreviação do dia da semana
 * @param {string} dataStr - Data no formato YYYY-MM-DD
 * @returns {string} Dia da semana abreviado (ex: "seg", "ter")
 */
export function obterDiaSemanaAbrev(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr + "T12:00:00");
  const diaSemana = data.getDay();
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return dias[diaSemana];
}

// ==================== HORAS ====================

/**
 * Formata datetime para exibição de hora (HH:MM)
 * @param {string} dataHora - DateTime ISO
 * @returns {string} Hora formatada (ex: "14:30")
 */
export function formatarHora(dataHora) {
  if (!dataHora) return "";
  const data = new Date(dataHora);
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata datetime completo (DD/MM/YYYY HH:MM)
 * @param {string} dataHora - DateTime ISO
 * @returns {string} Data e hora formatadas
 */
export function formatarDataHora(dataHora) {
  if (!dataHora) return "";
  const data = new Date(dataHora);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

/**
 * Formata horas decimais para exibição de banco de horas
 * @param {number} horas - Horas em formato decimal (ex: 2.5 = 2h30min)
 * @returns {string} Horas formatadas com sinal (ex: "+2h30min", "-1h15min")
 */
export function formatarBancoHoras(horas) {
  if (horas === null || horas === undefined) return "0h00min";
  const horasAbs = Math.abs(horas);
  const horasInteiras = Math.floor(horasAbs);
  const minutos = Math.round((horasAbs - horasInteiras) * 60);
  const sinal = horas >= 0 ? "+" : "-";
  return `${sinal}${horasInteiras}h${minutos.toString().padStart(2, "0")}min`;
}

// ==================== VALORES MONETÁRIOS ====================

/**
 * Formata valor para Real brasileiro
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
export function formatarReal(valor) {
  if (valor === null || valor === undefined) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Formata input de valor monetário dinamicamente (para uso em onChange)
 * @param {string} valor - String do input
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
export function formatarRealDinamico(valor) {
  valor = valor.replace(/\D/g, "");
  if (!valor) return "R$ 0,00";
  valor = (parseInt(valor, 10) / 100).toFixed(2);
  valor = valor.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${valor}`;
}

/**
 * Converte string formatada em Real para número
 * @param {string} valorFormatado - String no formato "R$ 1.234,56"
 * @returns {number} Valor numérico
 */
export function realParaNumero(valorFormatado) {
  if (!valorFormatado) return 0;
  return parseInt(valorFormatado.replace(/\D/g, ""), 10) / 100;
}

// ==================== TELEFONE ====================

/**
 * Formata telefone brasileiro
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado (ex: "(11) 99999-9999")
 */
export function formatarTelefone(telefone) {
  if (!telefone) return "";
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

/**
 * Formata input de telefone dinamicamente (para uso em onChange)
 * @param {Event} e - Evento do input
 * @returns {string} Telefone formatado
 */
export function formatarTelefoneDinamico(e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 6) {
    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  } else if (value.length > 2) {
    value = value.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  } else if (value.length > 0) {
    value = value.replace(/(\d{0,2})/, "($1");
  }
  return value;
}

// ==================== CPF ====================

/**
 * Formata CPF brasileiro
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado (ex: "123.456.789-00")
 */
export function formatarCPF(cpf) {
  if (!cpf) return "";
  const numeros = cpf.replace(/\D/g, "");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

