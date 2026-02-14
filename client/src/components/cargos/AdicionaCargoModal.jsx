import { memo, useState } from "react";
import { motion } from "framer-motion";
import { postCargos } from "../../services/api/cargoServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import { X, Briefcase, DollarSign, Sparkles } from "lucide-react";

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
      setModificado(true);
      mostrarAviso("sucesso", "Cargo criado com sucesso!", true);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10
                 bg-slate-900/95 backdrop-blur-xl shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Nova Função</h2>
                <p className="text-xs text-white/50 mt-0.5">Cadastre uma nova função</p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              onClick={() => setAdicionando(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <Sparkles size={16} className="text-white/50 mt-0.5 shrink-0" />
            <p className="text-sm text-white/60">
              Os salários dos níveis são calculados automaticamente com base no salário inicial.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <Briefcase size={14} />
                Nome da Função
              </label>
              <input
                type="text"
                value={nomeCargo}
                onChange={(e) => setNomeCargo(e.target.value)}
                placeholder="Ex: Assistente Administrativo"
                className="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm
                         placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <DollarSign size={14} />
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
                className="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm
                         placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAdicionando(false)}
            className="px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={criarCargo}
            className="px-5 py-2.5 rounded-lg text-sm text-white bg-white/15 hover:bg-white/20 border border-white/10 transition-colors focus:outline-none"
          >
            Criar Função
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(AdicionaCargoModal);
