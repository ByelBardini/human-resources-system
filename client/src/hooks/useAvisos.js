import { useState, useCallback } from "react";

const CORES_AVISO = { sucesso: "verde", erro: "vermelho", aviso: "amarelo" };

export function useAviso() {
  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("vermelho");
  const [textoAviso, setTextoAviso] = useState("");
  const [showButton, setShowButton] = useState(false);

  const mostrarAviso = useCallback((tipo, mensagem, comBotao = false) => {
    setCorAviso(CORES_AVISO[tipo] || "vermelho");
    setTextoAviso(mensagem);
    setShowButton(comBotao);
    setAviso(true);
  }, []);

  const limparAviso = useCallback(() => {
    setAviso(false);
  }, []);

  return { aviso, corAviso, textoAviso, showButton, mostrarAviso, limparAviso };
}
