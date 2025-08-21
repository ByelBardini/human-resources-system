import { useState } from "react";
import TabelaFuncionarios from "../funcionarios/TabelaFuncionarios.jsx";
import FiltrosFuncionarios from "../funcionarios/FiltroFuncionarios.jsx";

function Funcionarios({ setAdicionandoFunc }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState([]);
  const [sexoFiltro, setSexoFiltro] = useState([]);
  const [cargoFiltro, setCargoFiltro] = useState([]);
  const [setorFiltro, setSetorFiltro] = useState([]);
  const [nivelFiltro, setNivelFitro] = useState([]);
  const [mesAniversarioFiltro, setMesAniversatioFiltro] = useState([]);
  const [totalSalario, setTotalSalario] = useState(0);

  return (
    <div className="min-w-[1100px] w-full h-full">
      <div className="rounded-lg border border-white/10 transition-colors text-xl bg-white/5 backdrop-blur-xl p-2">
        <div className="w-full flex gap-3 justify-center">
          <FiltrosFuncionarios
            funcionarios={funcionarios}
            sexoFiltro={sexoFiltro}
            setSexoFiltro={setSexoFiltro}
            setorFiltro={setorFiltro}
            setSetorFiltro={setSetorFiltro}
            cargoFiltro={cargoFiltro}
            setCargoFiltro={setCargoFiltro}
            nivelFiltro={nivelFiltro}
            setNivelFiltro={setNivelFitro}
            mesAniversarioFiltro={mesAniversarioFiltro}
            setMesAniversatioFiltro={setMesAniversatioFiltro}
            setFuncionariosFiltrados={setFuncionariosFiltrados}
          />
        </div>
        <div className="mt-3 text-center font-bold">
          Total por mês: R${" "}
          {totalSalario.toLocaleString("pt-br", {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>
      <div className="mt-5 min-w-[1100px] relative w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
        <TabelaFuncionarios
          funcionarios={
            funcionariosFiltrados.length ? funcionariosFiltrados : funcionarios
          }
          setFuncionarios={setFuncionarios}
          totalSalario={totalSalario}
          setTotalSalario={setTotalSalario}
        />
      </div>
      <div className="mt-5 flex justify-center gap-6">
        <button
          onClick={() => setAdicionandoFunc(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
        >
          Adicionar Funcionário
        </button>
      </div>
    </div>
  );
}

export default Funcionarios;
