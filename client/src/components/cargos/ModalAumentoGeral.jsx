import { aumentoCargo } from "../../services/api/cargoServices.js";
import { useState } from "react";

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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-25"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white/5 backdrop-blur-lg rounded-lg p-6 w-full max-w-md border border-white/10 shadow-lg"
      >
        <button onClick={() => setAumentoGeral(false)}>
          <p className="text-white hover:text-white/70 transition absolute top-4 right-4 text-2xl font-bold cursor-pointer">
            ×
          </p>
        </button>
        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          Adicionar um Aumento Geral
        </h2>
        <p className="text-sm text-white/70 mb-6 text-center">
          Insira apenas a porcentagem do aumento, ele será aplicado a todos os
          cargos, e os salários dos níveis será recalculado
        </p>

        <form className="space-y-4">
          <div>
            <div className="flex">
              <label className="block text-sm text-white/80 mb-1">
                Valor do aumento (em porcentagem)
              </label>
            </div>
            <input
              type="type"
              placeholder="Ex: 6,5"
              value={porcentagem}
              onChange={(e) => setPorcentagem(e.target.value)}
              className="w-full rounded-xl bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
            />
          </div>

          <p className="text-sm text-red-500 mb-6 text-center">
            Atenção! <br />O aumento inserido aqui é irreversível
          </p>

          <button
            onClick={clicaAdiciona}
            type="button"
            className="mt-5 cursor-pointer w-full rounded-xl bg-blue-600 text-white font-medium py-3 hover:bg-blue-500 active:bg-blue-700 transition shadow-lg shadow-blue-900/30"
          >
            Inserir Aumento
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalAumentoGeral;
