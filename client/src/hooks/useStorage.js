import { useState, useCallback } from "react";

/**
 * Chaves do localStorage usadas no sistema.
 * Centraliza os nomes para evitar typos e facilitar refatoração.
 */
export const STORAGE_KEYS = {
  // Usuário
  USUARIO_ID: "usuario_id",
  USUARIO_NOME: "usuario_nome",
  USUARIO_LOGIN: "usuario_login",
  USUARIO_TROCA_SENHA: "usuario_troca_senha",
  USUARIO_CARGO_ID: "usuario_cargo_id",
  CARGO_NOME: "cargo_nome",
  PERMISSOES: "permissoes",
  EMPRESAS: "empresas",
  PODE_BATER_PONTO: "pode_bater_ponto",
  
  // Empresa
  EMPRESA_ID: "empresa_id",
  EMPRESA_NOME: "empresa_nome",
  EMPRESA_COR: "empresa_cor",
  
  // Navegação
  ABA_INICIAL: "aba_inicial",
  
  // Token
  TOKEN: "token",
};

/**
 * Hook para acessar dados do usuário logado no localStorage.
 * @returns {Object} Dados do usuário e funções de acesso
 */
export function useUsuarioStorage() {
  const getUsuarioId = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.USUARIO_ID);
  }, []);

  const getUsuarioNome = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.USUARIO_NOME);
  }, []);

  const getUsuarioLogin = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.USUARIO_LOGIN);
  }, []);

  const deveTrocarSenha = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.USUARIO_TROCA_SENHA) === "1";
  }, []);

  const setTrocaSenhaFlag = useCallback((valor) => {
    localStorage.setItem(STORAGE_KEYS.USUARIO_TROCA_SENHA, valor ? "1" : "0");
  }, []);

  return {
    getUsuarioId,
    getUsuarioNome,
    getUsuarioLogin,
    deveTrocarSenha,
    setTrocaSenhaFlag,
  };
}

/**
 * Hook para acessar dados da empresa selecionada no localStorage.
 * @returns {Object} Dados da empresa e funções de acesso
 */
export function useEmpresaStorage() {
  const getEmpresaId = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.EMPRESA_ID);
  }, []);

  const getEmpresaNome = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.EMPRESA_NOME);
  }, []);

  const getEmpresaCor = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.EMPRESA_COR);
  }, []);

  const setEmpresa = useCallback((empresa) => {
    localStorage.setItem(STORAGE_KEYS.EMPRESA_ID, empresa.empresa_id);
    localStorage.setItem(STORAGE_KEYS.EMPRESA_NOME, empresa.empresa_nome);
    if (empresa.empresa_cor) {
      localStorage.setItem(STORAGE_KEYS.EMPRESA_COR, empresa.empresa_cor);
    }
  }, []);

  const clearEmpresa = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.EMPRESA_ID);
    localStorage.removeItem(STORAGE_KEYS.EMPRESA_NOME);
    localStorage.removeItem(STORAGE_KEYS.EMPRESA_COR);
  }, []);

  return {
    getEmpresaId,
    getEmpresaNome,
    getEmpresaCor,
    setEmpresa,
    clearEmpresa,
  };
}

/**
 * Hook genérico para localStorage com estado reativo.
 * @param {string} key - Chave do localStorage
 * @param {*} initialValue - Valor inicial se não existir
 * @returns {[*, Function]} - [valor, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage[${key}]:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar localStorage[${key}]:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Limpa todos os dados do localStorage (logout).
 */
export function clearAllStorage() {
  localStorage.clear();
}

/**
 * Funções utilitárias para acesso direto ao localStorage (sem hooks).
 * Use quando não precisar de reatividade.
 */
export const storage = {
  // Getters
  getUsuarioId: () => localStorage.getItem(STORAGE_KEYS.USUARIO_ID),
  getUsuarioNome: () => localStorage.getItem(STORAGE_KEYS.USUARIO_NOME),
  getEmpresaId: () => localStorage.getItem(STORAGE_KEYS.EMPRESA_ID),
  getEmpresaNome: () => localStorage.getItem(STORAGE_KEYS.EMPRESA_NOME),
  getEmpresaCor: () => localStorage.getItem(STORAGE_KEYS.EMPRESA_COR),
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  getAbaInicial: () => localStorage.getItem(STORAGE_KEYS.ABA_INICIAL),
  deveTrocarSenha: () => localStorage.getItem(STORAGE_KEYS.USUARIO_TROCA_SENHA) === "1",
  podeBaterPonto: () => localStorage.getItem(STORAGE_KEYS.PODE_BATER_PONTO) === "true",
  
  // Setters
  setUsuario: (usuario) => {
    localStorage.setItem(STORAGE_KEYS.USUARIO_ID, usuario.usuario_id);
    localStorage.setItem(STORAGE_KEYS.USUARIO_NOME, usuario.usuario_nome);
    localStorage.setItem(STORAGE_KEYS.USUARIO_LOGIN, usuario.usuario_login);
    if (usuario.usuario_troca_senha !== undefined) {
      localStorage.setItem(STORAGE_KEYS.USUARIO_TROCA_SENHA, usuario.usuario_troca_senha ? "1" : "0");
    }
  },
  
  setEmpresa: (empresa) => {
    localStorage.setItem(STORAGE_KEYS.EMPRESA_ID, empresa.empresa_id);
    localStorage.setItem(STORAGE_KEYS.EMPRESA_NOME, empresa.empresa_nome);
    if (empresa.empresa_cor) {
      localStorage.setItem(STORAGE_KEYS.EMPRESA_COR, empresa.empresa_cor);
    }
  },
  
  setToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },
  
  setAbaInicial: (aba) => {
    localStorage.setItem(STORAGE_KEYS.ABA_INICIAL, aba);
  },
  
  // Clear
  clear: () => localStorage.clear(),
};

export default storage;

