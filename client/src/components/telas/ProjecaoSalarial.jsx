import { useEffect, useState } from "react";
import { getCargos, deleteCargo } from "../../services/api/cargoServices.js";
import TabelaCargos from "../cargos/tabelaCargos.jsx";
import FiltroCargos from "../cargos/FiltroCargos.jsx";

export default function ProjecaoSalarial({
  setAdicionando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setCorAviso,
  setTextoAviso,
  setAviso,
  setAumentoGeral,
}) {
  const [cargos, setCargos] = useState([{ niveis: [] }]);
  const [cargosFiltro, setCargosFiltro] = useState([]);

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
        window.location.reload();
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
          cargosFiltro={cargosFiltro}
          selecionado={selecionado}
          selecionaCampo={selecionaCampo}
          clicaDeleta={clicaDeleta}
        />
      </div>

      <div className="absolute top-12 left-58 z-50">
        <FiltroCargos
          cargos={cargos}
          setCargosFiltro={setCargosFiltro}
          cargosFiltro={cargosFiltro}
        />
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => setAdicionando(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
        >
          Adicionar Cargo
        </button>

        <button
          onClick={() => setAumentoGeral(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/10 text-emerald-400 shadow"
        >
          Aumento Geral
        </button>
      </div>
    </div>
  );
}
