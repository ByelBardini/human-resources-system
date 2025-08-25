import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import TabelaFuncionarios from "../funcionarios/TabelaFuncionarios.jsx";
import FiltrosFuncionarios from "../funcionarios/FiltroFuncionarios.jsx";

function Funcionarios({
  setAdicionandoFunc,
  setCardFuncionario,
  modificado,
  setModificado,
}) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState([]);
  const [sexoFiltro, setSexoFiltro] = useState([]);
  const [cargoFiltro, setCargoFiltro] = useState([]);
  const [setorFiltro, setSetorFiltro] = useState([]);
  const [nivelFiltro, setNivelFitro] = useState([]);
  const [mesAniversarioFiltro, setMesAniversarioFiltro] = useState([]);
  const [totalSalario, setTotalSalario] = useState(0);
  const [filtroAtivo, setFiltroAtivo] = useState(0);

  function salarioTotal(listaFuncionarios) {
    return listaFuncionarios.reduce(
      (acc, func) => acc + (func.nivel?.nivel_salario || 0),
      0
    );
  }

  useEffect(() => {
    const listaFuncionarios = funcionariosFiltrados.length
      ? funcionariosFiltrados
      : funcionarios;
    setTotalSalario(salarioTotal(listaFuncionarios));
  }, [funcionarios, funcionariosFiltrados]);

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
            setMesAniversarioFiltro={setMesAniversarioFiltro}
            setFuncionariosFiltrados={setFuncionariosFiltrados}
            filtroAtivo={filtroAtivo}
            setFiltroAtivo={setFiltroAtivo}
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
        {filtroAtivo && funcionariosFiltrados.length === 0 ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
            <SearchX size={16} className="opacity-80" />
            Nenhum cargo encontrado
          </div>
        ) : (
          <TabelaFuncionarios
            funcionarios={
              funcionariosFiltrados.length
                ? funcionariosFiltrados
                : funcionarios
            }
            setFuncionarios={setFuncionarios}
            setCardFuncionario={setCardFuncionario}
            setModificado={setModificado}
            modificado={modificado}
          />
        )}
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
