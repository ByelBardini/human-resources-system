import { useEffect, useState } from "react";
import { getCargos, deleteCargo } from "../../services/api/cargoServices.js";
import TabelaCargos from "../cargos/tabelaCargos.jsx";

export default function ProjecaoSalarial({
  setAdicionando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setCorAviso,
  setTextoAviso,
  setAviso,
}) {
  const [cargos, setCargos] = useState([{ niveis: [] }]);

  const [selecionado, setSelecionado] = useState({ linha: null, campo: null });

  function clicaDeleta(id) {
    setConfirmacao(true);
    setTextoConfirmacao(
      "Você tem certeza que deseja excluir esse cargo? Essa ação é irreversível"
    );
    setOnSimConfirmacao(() => () => deletaCargo(id));
  }

  async function deletaCargo(id) {
    try {
      await deleteCargo(id);
      setConfirmacao(false);
      setCorAviso("verde");
      setTextoAviso("Cargo excluído com sucesso!");
      setAviso(true);
      setTimeout(() => {
        setAviso(false);
        buscaCargos();
      }, 500);
    } catch (err) {
      setConfirmacao(false);
      console.error("Erro ao deletar cargo:", err);
      setCorAviso("vermelho");
      setTextoAviso("Erro ao deletar cargo:", err.message || err);
      setAviso(true);
    }
  }

  function selecionaCampo(cargoId, campoId) {
    setSelecionado(
      (prev) =>
        prev.linha === cargoId && prev.campo === campoId
          ? { linha: null, campo: null } // desmarca
          : { linha: cargoId, campo: campoId } // marca
    );
  }

  async function buscaCargos() {
    const empresa_id = localStorage.getItem("empresa_id");

    try {
      const cargos = await getCargos(empresa_id);
      console.log(cargos);
      setCargos(cargos);
    } catch (err) {
      console.error("Erro ao buscar cargos:", err);
    }
  }

  useEffect(() => {
    buscaCargos();
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div className="relative w-full h-full min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5/50 backdrop-blur-xl shadow-xl">
        <TabelaCargos
          cargos={cargos}
          selecionado={selecionado}
          selecionaCampo={selecionaCampo}
          clicaDeleta={clicaDeleta}
        />
      </div>

      {/* Ações */}
      <div className="flex justify-center">
        <button
          onClick={() => setAdicionando(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
        >
          Adicionar Cargo
        </button>
      </div>
    </div>
  );
}
