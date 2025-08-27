import { useState, useCallback } from "react";

export function useAviso() {
  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("vermelho");
  const [textoAviso, setTextoAviso] = useState("");

  const mostrarAviso = useCallback((tipo, mensagem) => {
    const cores = { sucesso: "verde", erro: "vermelho", aviso: "amarelo" };

    setCorAviso(cores[tipo] || "vermelho");
    setTextoAviso(mensagem);
    setAviso(true);
  }, []);

  const limparAviso = useCallback(() => {
    setAviso(false);
  }, []);

  return { aviso, corAviso, textoAviso, mostrarAviso, limparAviso };
}
