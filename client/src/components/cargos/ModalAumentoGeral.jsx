import { aumentoCargo } from "../../services/api/cargoServices.js";
import { useState } from "react";
import { X } from "lucide-react";

function ModalAumentoGeral({
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAumentoGeral,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
}) {
  const [porcentagem, setPorcentagem] = useState("");

  function clicaAdiciona() {
    setTextoConfirmacao("Você tem certeza que deseja aplicar esse aumento?");
    setOnSimConfirmacao(() => () => confirmaAdicionar());
    setConfirmacao(true);
  }

  async function confirmaAdicionar() {
    if (porcentagem == "") {
      setCorAviso("vermelho");
      setTextoAviso("O valor da porcentagem é necessário");
      setAviso(true);
      return;
    }

    setCarregando(true);
    try {
      const id_empresa = localStorage.getItem("empresa_id");
      await aumentoCargo(id_empresa, porcentagem);
      setCarregando(false);
      setCorAviso("verde");
      setTextoAviso("Aumento aplicado com sucesso!");
      setAviso(true);
      setTimeout(() => {
        setAviso(false);
        setAumentoGeral(false);
        window.location.reload();
      }, 500);
      return;
    } catch (err) {
      setCarregando(false);
      console.error("Erro ao criar cargo:", err);
      setCorAviso("vermelho");
      setTextoAviso("Erro ao criar cargo:", err.message || err);
      setAviso(true);
      return;
    }
  }

  return (
    <div
      onClick={() => setAumentoGeral(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          <h2 className="text-lg font-semibold">Adicionar um Aumento Geral</h2>
          <button
            type="button"
            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center
                     rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
            title="Fechar"
            onClick={() => setAumentoGeral(false)}
          >
            <span className="text-xl leading-none">
              <X size={18} />
            </span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-white/70">
            Insira apenas a porcentagem do aumento, ele será aplicado a todos os
            cargos, e os salários dos níveis será recalculado
          </p>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Valor do aumento (em porcentagem)
            </label>
            <input
              type="text"
              placeholder="Ex: 6,5"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                       placeholder-white/40 outline-none focus:bg-white/15 [color-scheme:dark]"
            />
          </div>

          <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <strong className="font-semibold">Atenção!</strong> O aumento
            inserido aqui é irreversível.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAumentoGeral(false)}
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={clicaAdiciona}
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/20 border border-white/10 hover:bg-white/30 shadow"
          >
            Inserir Aumento
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAumentoGeral;
