import { postCargos } from "../../services/api/cargoServices.js";
import { useState } from "react";

function AdicionaCargoModal({
  setAdicionando,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
}) {
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
      setCorAviso("amarelo");
      setTextoAviso("Por favor, preencha todos os campos.");
      setAviso(true);
      return;
    }
    setCarregando(true);
    try {
      const salInicial = parseInt(salarioInicial.replace(/\D/g, ""), 10) / 100;
      const id_empresa = localStorage.getItem("empresa_id");
      await postCargos(id_empresa, nomeCargo, salInicial);
      setCarregando(false);
      setCorAviso("verde");
      setTextoAviso("Cargo criado com sucesso!");
      setAviso(true);
      setTimeout(() => {
        setAviso(false);
        setAdicionando(false);
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
      onClick={() => setAdicionando(false)}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-25"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white/5 backdrop-blur-lg rounded-lg p-6 w-full max-w-md border border-white/10 shadow-lg"
      >
        <button onClick={() => setAdicionando(false)}>
          <p className="text-white hover:text-white/70 transition absolute top-4 right-4 text-2xl font-bold cursor-pointer">
            ×
          </p>
        </button>
        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          Adicionar Novo Cargo
        </h2>
        <p className="text-sm text-white/70 mb-6 text-center">
          Os salários dos níveis são calculados automaticamente com base no
          salário inicial.
        </p>

        <form className="space-y-4">
          <div>
            <div className="flex">
              <label className="block text-sm text-white/80 mb-1">
                Nome do Cargo
              </label>
            </div>
            <input
              type="text"
              value={nomeCargo}
              onChange={(e) => setNomeCargo(e.target.value)}
              placeholder="Ex: Assistente Administrativo"
              className="w-full rounded-xl bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
            />
          </div>

          <div>
            <div className="flex">
              <label className="block text-sm text-white/80 mb-1">
                Salário Inicial
              </label>
            </div>
            <input
              type="text"
              inputMode="numeric"
              onChange={(e) =>
                setSalarioInicial(formatarRealDinamico(e.target.value))
              }
              value={salarioInicial}
              placeholder="Ex: 2000"
              className="w-full rounded-xl bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
            />
          </div>

          <button
            type="button"
            onClick={criarCargo}
            className="mt-5 cursor-pointer w-full rounded-xl bg-blue-600 text-white font-medium py-3 hover:bg-blue-500 active:bg-blue-700 transition shadow-lg shadow-blue-900/30"
          >
            Criar Cargo
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdicionaCargoModal;
