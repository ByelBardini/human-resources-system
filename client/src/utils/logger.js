/**
 * Logger centralizado para o sistema.
 * Só exibe logs no ambiente de desenvolvimento.
 * Em produção, os logs são silenciados para evitar vazamento de informações.
 */

const isDev = import.meta.env.DEV;

/**
 * Logger com métodos para diferentes níveis de log.
 * Em produção, todos os métodos são no-op (funções vazias).
 */
const logger = {
  /**
   * Log informativo (equivalente a console.log)
   */
  log: isDev
    ? (...args) => console.log("[LOG]", ...args)
    : () => {},

  /**
   * Log de informação destacada
   */
  info: isDev
    ? (...args) => console.info("[INFO]", ...args)
    : () => {},

  /**
   * Log de aviso (não crítico)
   */
  warn: isDev
    ? (...args) => console.warn("[WARN]", ...args)
    : () => {},

  /**
   * Log de erro (sempre visível, mesmo em produção, mas sem detalhes sensíveis)
   */
  error: isDev
    ? (...args) => console.error("[ERROR]", ...args)
    : (message) => {
        // Em produção, loga apenas a mensagem principal sem stack trace ou dados sensíveis
        if (typeof message === "string") {
          console.error("[ERROR]", message);
        }
      },

  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug: isDev
    ? (...args) => console.debug("[DEBUG]", ...args)
    : () => {},

  /**
   * Log de tabela (útil para arrays/objetos)
   */
  table: isDev
    ? (data) => console.table(data)
    : () => {},

  /**
   * Agrupa logs relacionados
   */
  group: isDev
    ? (label) => console.group(label)
    : () => {},

  groupEnd: isDev
    ? () => console.groupEnd()
    : () => {},
};

export default logger;

