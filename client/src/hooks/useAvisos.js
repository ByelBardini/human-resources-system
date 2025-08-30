import { useState, useCallback } from "react";

export function useAviso() {
  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("vermelho");
  const [textoAviso, setTextoAviso] = useState("");
  const [showButton, setShowButton] = useState(false); // 👈 novo estado

  const mostrarAviso = useCallback((tipo, mensagem, comBotao = false) => {
    const cores = { sucesso: "verde", erro: "vermelho", aviso: "amarelo" };

    setCorAviso(cores[tipo] || "vermelho");
    setTextoAviso(mensagem);
    setShowButton(comBotao);
    setAviso(true);
  }, []);

  const limparAviso = useCallback(() => {
    setAviso(false);
  }, []);

  return { aviso, corAviso, textoAviso, showButton, mostrarAviso, limparAviso };
}
