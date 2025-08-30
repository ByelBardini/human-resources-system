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
      mostrarAviso("sucesso", "Cargo excluído com sucesso!", true)
      setModificado(true);
      setTimeout(() => {
        limparAviso;
        buscaCargos();
      }, 500);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro","Sessão inválida! Realize o Login novamente!");
        console.error(err.message, err);
        setTimeout(() => {
          limparAviso;
          navigate("/", { replace: true });
        }, 1000);
      } else if (err.status == 409) {
        setCarregando(false);
        setConfirmacao(false);
        console.error(err.message, err);
        mostrarAviso("erro", "Impossível excluir um cargo que já possua funcionários vinculados", true)
      } else {
        setCarregando(false);
        setConfirmacao(false);
        mostrarAviso("erro", err.message, true)
        console.error( err);
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
      <div className="relative w-full h-full min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5/50 backdrop-blur-xl shadow-xl">
        <TabelaCargos
          cargos={cargos}
          cargosFiltro={cargosFiltro}
          selecionado={selecionado}
          selecionaCampo={selecionaCampo}
          clicaDeleta={clicaDeleta}
        />
      </div>

      <div className="absolute top-6 left-46 z-50">
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
          Adicionar Função
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
