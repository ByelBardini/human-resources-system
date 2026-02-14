/* eslint-disable react-hooks/exhaustive-deps */
import FiltroSetor from "./FiltroSetor";
import FiltroCargo from "./FiltroCargo";
import { useEffect } from "react";

function FiltrosDescricao({
  descricoes,
  setorFiltro,
  setSetorFiltro,
  cargoFiltro,
  setCargoFiltro,
  setDescricoesFiltradas,
}) {
  function definirFiltros() {
    const getCargoNome = (x) =>
      x?.cargo?.cargo_nome ?? x?.descricao?.cargo?.cargo_nome ?? "";
    const getSetorNome = (x) =>
      x?.setor?.setor_nome ?? x?.descricao?.setor?.setor_nome ?? "";

    const cargosSel = new Set(cargoFiltro.map(getCargoNome).filter(Boolean));
    const setoresSel = new Set(setorFiltro.map(getSetorNome).filter(Boolean));

    // Se não há filtros ativos, retorna array vazio
    if (cargosSel.size === 0 && setoresSel.size === 0) {
      setDescricoesFiltradas([]);
      return;
    }

    const filtradas = descricoes.filter((d) => {
      const cargoOk = cargosSel.size === 0 || cargosSel.has(getCargoNome(d));
      const setorOk = setoresSel.size === 0 || setoresSel.has(getSetorNome(d));
      return cargoOk && setorOk;
    });

    setDescricoesFiltradas(filtradas);
  }

  useEffect(() => {
    definirFiltros();
  }, [setorFiltro, cargoFiltro]);

  const filtrosAtivos = setorFiltro.length + cargoFiltro.length;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <FiltroSetor
          descricoes={descricoes}
          descricaoFiltro={setorFiltro}
          setDescricaoFiltro={setSetorFiltro}
        />
        <FiltroCargo
          descricoes={descricoes}
          descricaoFiltro={cargoFiltro}
          setDescricaoFiltro={setCargoFiltro}
        />
      </div>
      {filtrosAtivos > 0 && (
        <button
          onClick={() => {
            setSetorFiltro([]);
            setCargoFiltro([]);
          }}
          className="text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          Limpar filtros ({filtrosAtivos})
        </button>
      )}
    </div>
  );
}

export default FiltrosDescricao;
