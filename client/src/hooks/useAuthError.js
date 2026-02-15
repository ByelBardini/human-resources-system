import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";

/**
 * Hook centralizado para tratamento de erros de autenticação (401/403).
 * Evita duplicação de código em todo o projeto.
 * 
 * @returns {Object} - { handleAuthError, isAuthError }
 * 
 * @example
 * const { handleAuthError, isAuthError } = useAuthError();
 * 
 * try {
 *   await apiCall();
 * } catch (err) {
 *   if (isAuthError(err)) {
 *     handleAuthError();
 *   } else {
 *     // tratamento normal do erro
 *   }
 * }
 */
export function useAuthError() {
  const navigate = useNavigate();
  const { mostrarAviso, limparAviso } = useAviso();

  const isAuthError = useCallback((err) => {
    return err?.status === 401 || err?.status === 403;
  }, []);

  const handleAuthError = useCallback((setCarregando) => {
    if (setCarregando) {
      setCarregando(false);
    }
    mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
    setTimeout(() => {
      limparAviso();
      navigate("/", { replace: true });
    }, 1000);
  }, [mostrarAviso, limparAviso, navigate]);

  return { handleAuthError, isAuthError };
}

export default useAuthError;

