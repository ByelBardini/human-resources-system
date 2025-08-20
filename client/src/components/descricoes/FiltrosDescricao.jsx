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

  return (
    <div className="w-full rounded-lg border border-white/10 transition-colors text-xl bg-white/5 backdrop-blur-xl p-2">
      <div className="w-full flex gap-3 justify-center">
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
    </div>
  );
}

export default FiltrosDescricao;
