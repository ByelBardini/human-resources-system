import { useMemo, useCallback } from "react";

function lerJsonLocalStorage(chave, padrao = []) {
  try {
    const str = localStorage.getItem(chave);
    return str ? JSON.parse(str) : padrao;
  } catch {
    return padrao;
  }
}

export function usePermissao() {
  const permissoes = useMemo(() => lerJsonLocalStorage("permissoes"), []);
  const empresas = useMemo(() => lerJsonLocalStorage("empresas"), []);

  const temPermissao = useCallback(
    (codigoPermissao) => permissoes.includes(codigoPermissao),
    [permissoes]
  );

  const temPermissaoCategoria = useCallback(
    (categoria) => permissoes.some((p) => p.startsWith(`${categoria}.`)),
    [permissoes]
  );

  const temAcessoEmpresa = useCallback(
    (empresaId) => {
      if (!empresas?.length) return true;
      return empresas.includes(empresaId);
    },
    [empresas]
  );

  const getEmpresasAcesso = useCallback(() => empresas ?? [], [empresas]);

  return {
    permissoes,
    empresas,
    temPermissao,
    temPermissaoCategoria,
    temAcessoEmpresa,
    getEmpresasAcesso,
  };
}
