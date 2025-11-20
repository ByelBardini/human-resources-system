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

  const temPermissao = (codigoPermissao) => {
    return permissoes.includes(codigoPermissao);
  };

  return { permissoes, temPermissao };
}

