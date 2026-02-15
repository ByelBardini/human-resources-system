import { memo, useState } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Percent, AlertTriangle } from "lucide-react";
import { aumentoCargo } from "../../services/api/cargoServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import { storage } from "../../hooks/useStorage.js";
import logger from "../../utils/logger.js";

function ModalAumentoGeral({
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAumentoGeral,
  setCarregando,
  setModificado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [porcentagem, setPorcentagem] = useState("");

  function clicaAdiciona() {
    setTextoConfirmacao("Você tem certeza que deseja aplicar esse aumento?");
    setOnSimConfirmacao(() => () => confirmaAdicionar());
    setConfirmacao(true);
  }

  async function confirmaAdicionar() {
    setConfirmacao(false);
    if (porcentagem === "") {
      mostrarAviso("erro", "O valor da porcentagem é necessário", true)
      return;
    }

    setCarregando(true);
    try {
      const id_empresa = storage.getEmpresaId();
      await aumentoCargo(id_empresa, porcentagem);
      setCarregando(false);
      mostrarAviso("sucesso", "Aumento aplicado com sucesso!", true)
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        setAumentoGeral(false);
      }, 500);
      return;
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      logger.error(err.message, err);
      return;
    }
  }

  return (
    <div
      onClick={() => setAumentoGeral(false)}
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
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Aumento Geral</h2>
                <p className="text-xs text-white/50 mt-0.5">Aplicar reajuste em todas as funções</p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              onClick={() => setAumentoGeral(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <Percent size={16} className="text-white/50 mt-0.5 shrink-0" />
            <p className="text-sm text-white/60">
              Insira a porcentagem do aumento. Ele será aplicado a todas as funções e os salários serão recalculados.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <Percent size={14} />
              Valor do aumento (%)
            </label>
            <input
              type="text"
              placeholder="Ex: 6,5"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm
                       placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200/80">
              <strong className="font-medium">Atenção:</strong> Esta ação é irreversível.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAumentoGeral(false)}
            className="px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={clicaAdiciona}
            type="button"
            className="px-5 py-2.5 rounded-lg text-sm text-white bg-white/15 hover:bg-white/20 border border-white/10 transition-colors focus:outline-none"
          >
            Aplicar Aumento
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(ModalAumentoGeral);
