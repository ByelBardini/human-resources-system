import { X } from "lucide-react";
import { useState } from "react";
import { inativarFuncionario } from "../../services/api/funcionarioService.js";

function ModalInativa({
  setInativando,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
  setCard,
  setAdicionado,
}) {
  const [data, setData] = useState("");
  const [comentario, setComentario] = useState("");

  async function inativar() {
    const id = localStorage.getItem("funcionario_id");

    if (data == "") {
      setTextoAviso("Você precisa informar a data de inativação!");
      setCorAviso("vermelho");
      setAviso(true);
      return;
    }
    setCarregando(true);
    try {
      await inativarFuncionario(id, data, comentario);
      setTextoAviso("Funcionário desligado com sucesso!");
      setCorAviso("verde");
      setAviso(true);
      setAdicionado(true);
      setTimeout(() => {
        setCard(false);
        setInativando(false);
        setAviso(false);
      }, 500);
    } catch (err) {
      setCorAviso("vermelho");
      setTextoAviso(
        `Erro ao desligar Funcionário: ${
          err?.response?.data?.error || err?.message || "tente novamente"
        }`
      );
      setAviso(true);
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10
                      bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-2xl text-white overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold">Desligar Funcionário</h2>
          <button
            type="button"
            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
            title="Fechar"
            onClick={() => setInativando(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Data de desligamento
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                         outline-none focus:bg-white/15 [color-scheme:dark]"
              placeholder="Selecione a data"
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Motivo do desligamento
            </label>
            <textarea
              rows={5}
              placeholder="Descreva o motivo…"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40
                         outline-none focus:bg-white/15 resize-y min-h-28 whitespace-pre-wrap break-words leading-relaxed"
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setInativando(false)}
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={inativar}
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/20 border border-white/10 hover:bg-white/30 shadow"
          >
            Confirmar desligamento
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalInativa;
