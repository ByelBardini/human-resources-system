/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { getCargos, deleteCargo } from "../../services/api/cargoServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import TabelaCargos from "../cargos/tabelaCargos.jsx";
import FiltroCargos from "../cargos/FiltroCargos.jsx";

export default function ProjecaoSalarial({
  setAdicionando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAumentoGeral,
  setCarregando,
  navigate,
  setModificado,
  modificado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [cargos, setCargos] = useState([{ niveis: [] }]);
  const [cargosFiltro, setCargosFiltro] = useState([]);

  const [selecionado, setSelecionado] = useState({ linha: null, campo: null });

  function clicaDeleta(id) {
    setConfirmacao(true);
    setTextoConfirmacao(
      "Você tem certeza que deseja excluir essa função? Essa ação é irreversível"
    );
    setOnSimConfirmacao(() => () => deletaCargo(id));
  }

  async function deletaCargo(id) {
    setCarregando(true);
    try {
      await deleteCargo(id);
      setCarregando(false);
      setConfirmacao(false);
      mostrarAviso("sucesso", "Cargo excluído com sucesso!", true);
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        buscaCargos();
      }, 500);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        console.error(err.message, err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else if (err.status == 409) {
        setCarregando(false);
        setConfirmacao(false);
        console.error(err.message, err);
        mostrarAviso(
          "erro",
          "Impossível excluir um cargo que já possua funcionários vinculados",
          true
        );
      } else {
        setCarregando(false);
        setConfirmacao(false);
        mostrarAviso("erro", err.message, true);
        console.error(err);
      }
    }
  }

  function selecionaCampo(cargoId, campoId) {
    setSelecionado((prev) =>
      prev.linha === cargoId && prev.campo === campoId
        ? { linha: null, campo: null }
        : { linha: cargoId, campo: campoId }
    );
  }

  async function buscaCargos() {
    const empresa_id = localStorage.getItem("empresa_id");

    try {
      const cargos = await getCargos(empresa_id);
      setCargos(cargos);
    } catch (err) {
      mostrarAviso("erro", err.message);
      console.error(err.message, err);
    }
  }

  useEffect(() => {
    buscaCargos();
    setModificado(false);
  }, [modificado]);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div className="relative w-full h-full min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
        <TabelaCargos
          cargos={cargos}
          cargosFiltro={cargosFiltro}
          selecionado={selecionado}
          selecionaCampo={selecionaCampo}
          clicaDeleta={clicaDeleta}
          filtroCargos={
            <FiltroCargos
              cargos={cargos}
              setCargosFiltro={setCargosFiltro}
              cargosFiltro={cargosFiltro}
            />
          }
        />
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setAdicionando(true)}
          className="px-4 py-2 rounded-lg text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors focus:outline-none"
        >
          Adicionar Função
        </button>

        <button
          onClick={() => setAumentoGeral(true)}
          className="px-4 py-2 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors focus:outline-none"
        >
          Aumento Geral
        </button>
      </div>
    </div>
  );
}
