import FiltrosDescricao from "../descricoes/FiltrosDescricao.jsx";
import TabelaDescricao from "../descricoes/TabelaDescricao.jsx";
import { getDescricoes } from "../../services/api/descricaoService.js";
import { useState } from "react";
import { useEffect } from "react";

function ManualFuncoes({ setDesc, setModificaDesc }) {
  const [descricoes, setDescricoes] = useState([]);
  const [setorFiltro, setSetorFiltro] = useState([]);
  const [cargoFiltro, setCargoFiltro] = useState([]);
  const [descricoesFiltradas, setDescricoesFiltradas] = useState([]);

  async function puxarDescricoes() {
    const id = localStorage.getItem("empresa_id");
    try {
      const descricoes = await getDescricoes(id);
      console.log(descricoes);
      setDescricoes(descricoes);
    } catch (err) {
      console.eror(err);
    }
  }

  useEffect(() => {
    puxarDescricoes();
  }, []);

  return (
    <div className="min-w-[1100px] w-full h-full">
      <FiltrosDescricao
        descricoes={descricoes}
        setorFiltro={setorFiltro}
        setSetorFiltro={setSetorFiltro}
        cargoFiltro={cargoFiltro}
        setCargoFiltro={setCargoFiltro}
        descricoesFiltradas={descricoesFiltradas}
        setDescricoesFiltradas={setDescricoesFiltradas}
      />
      <TabelaDescricao
        descricoes={descricoes}
        setDesc={setDesc}
        setModificaDesc={setModificaDesc}
        descricoesFiltradas={descricoesFiltradas}
      />

      <div className="mt-5 flex justify-center gap-6"></div>
    </div>
  );
}

export default ManualFuncoes;
