import { useMemo } from "react";

export function usePermissao() {
  const permissoes = useMemo(() => {
    try {
      const permissoesStr = localStorage.getItem("permissoes");
      return permissoesStr ? JSON.parse(permissoesStr) : [];
    } catch {
      return [];
    }
  }, []);

  const empresas = useMemo(() => {
    try {
      const empresasStr = localStorage.getItem("empresas");
      return empresasStr ? JSON.parse(empresasStr) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param {string} codigoPermissao - Código da permissão (ex: "ponto.registrar", "usuarios.gerenciar")
   */
  const temPermissao = (codigoPermissao) => {
    return permissoes.includes(codigoPermissao);
  };

  /**
   * Verifica se o usuário tem alguma permissão de uma categoria
   * @param {string} categoria - Código da categoria (ex: "ponto", "usuarios", "cargos", "sistema")
   */
  const temPermissaoCategoria = (categoria) => {
    return permissoes.some((p) => p.startsWith(`${categoria}.`));
  };

  /**
   * Verifica se o usuário tem acesso a uma empresa específica
   * Se empresas estiver vazio, tem acesso a todas
   * @param {number} empresaId - ID da empresa
   */
  const temAcessoEmpresa = (empresaId) => {
    if (!empresas || empresas.length === 0) return true;
    return empresas.includes(empresaId);
  };

  /**
   * Retorna as empresas que o usuário tem acesso
   * Array vazio significa acesso a todas
   */
  const getEmpresasAcesso = () => {
    return empresas || [];
  };

  return {
    permissoes,
    empresas,
    temPermissao,
    temPermissaoCategoria,
    temAcessoEmpresa,
    getEmpresasAcesso,
  };
}
