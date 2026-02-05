/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAviso } from "../context/AvisoContext.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import Background from "../components/default/Background.jsx";
import EmitirRelatoriosConteudo from "../components/telas/EmitirRelatorios.jsx";

function EmitirRelatorios() {
  const navigate = useNavigate();
  const { mostrarAviso } = useAviso();
  const { temPermissao } = usePermissao();

  useEffect(() => {
    if (!temPermissao("sistema.emitir_relatorios")) {
      mostrarAviso("erro", "Você não tem permissão para acessar esta página!");
      navigate("/home", { replace: true });
      return;
    }
    document.title = "Emitir relatórios - Sistema RH";
  }, [temPermissao, mostrarAviso, navigate]);

  if (!temPermissao("sistema.emitir_relatorios")) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-start p-6 overflow-hidden">
      <Background />

      <button
        className="absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/home", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="relative z-10 w-full max-w-6xl px-4 pt-16 pb-8 min-h-screen">
        <p className="text-sm text-white/60 text-center mb-6">
          Selecione a empresa e exporte planilhas de funções, projeção salarial ou funcionários.
        </p>

        <EmitirRelatoriosConteudo navigate={navigate} />
      </div>
    </div>
  );
}

export default EmitirRelatorios;
