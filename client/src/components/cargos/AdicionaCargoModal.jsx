import { postCargos } from "../../services/api/cargoServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import { useState } from "react";
import { X } from "lucide-react";

function AdicionaCargoModal({ setAdicionando, setCarregando, setModificado }) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [nomeCargo, setNomeCargo] = useState("");
  const [salarioInicial, setSalarioInicial] = useState("R$ 0,00");

  function formatarRealDinamico(valor) {
    valor = valor.replace(/\D/g, "");
    if (!valor) return "R$ 0,00";
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `R$ ${valor}`;
  }

  async function criarCargo() {
    if (nomeCargo.trim() === "" || salarioInicial === "R$ 0,00") {
      mostrarAviso("aviso", "Por favor, preencha todos os campos.", true);
      return;
    }
    setCarregando(true);
    try {
      const salInicial = parseInt(salarioInicial.replace(/\D/g, ""), 10) / 100;
      const id_empresa = localStorage.getItem("empresa_id");
      await postCargos(id_empresa, nomeCargo, salInicial);
      setCarregando(false);
      mostrarAviso("sucesso", "Cargo criado com sucesso!", true);
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        setAdicionando(false);
      }, 500);
      return;
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      console.error(err.message, err);
      return;
    }
  }

  return (
    <div
      onClick={() => setAdicionando(false)}
      className="fixed inset-0 z-150 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10
                 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl
                 shadow-2xl text-white overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold">Adicionar Novo Cargo</h2>
          <button
            type="button"
            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center
                     rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
            title="Fechar"
            onClick={() => setAdicionando(false)}
          >
            <span className="text-xl leading-none">
              <X size={18} />
            </span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-white/70">
            Os salários dos níveis são calculados automaticamente com base no
            salário inicial.
          </p>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Nome da Função
            </label>
            <input
              type="text"
              value={nomeCargo}
              onChange={(e) => setNomeCargo(e.target.value)}
              placeholder="Ex: Assistente Administrativo"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                       placeholder-white/40 outline-none focus:bg-white/15 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Salário Inicial
            </label>
            <input
              type="text"
              inputMode="numeric"
              onChange={(e) =>
                setSalarioInicial(formatarRealDinamico(e.target.value))
              }
              value={salarioInicial}
              placeholder="R$ 0,00"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                       placeholder-white/40 outline-none focus:bg-white/15 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAdicionando(false)}
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={criarCargo}
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/20 border border-white/10 hover:bg-white/30 shadow"
          >
            Criar Função
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdicionaCargoModal;
