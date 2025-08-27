/* eslint-disable react-hooks/exhaustive-deps */
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

  const [inativos, setInativos] = useState(true);

  function buscaInativos() {
    setInativos(!inativos);
  }

  function salarioTotal(listaFuncionarios) {
    if (inativos) {
      return listaFuncionarios.reduce(
        (acc, func) => acc + (func.nivel?.nivel_salario || 0),
        0
      );
    } else {
      return listaFuncionarios.reduce(
        (acc, func) => acc + (func.funcionario_gasto_desligamento || 0),
        0
      );
    }
  }

  useEffect(() => {
    if (filtroAtivo && funcionariosFiltrados.length === 0) {
      setTotalSalario(0);
    } else {
      const listaFuncionarios = funcionariosFiltrados.length
        ? funcionariosFiltrados
        : funcionarios;
      setTotalSalario(salarioTotal(listaFuncionarios));
    }
  }, [funcionarios, funcionariosFiltrados, inativos]);

  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const label = inativos ? "Total por mês" : "Gasto total com desligamentos";

  const colors = inativos
    ? {
        ring: "ring-emerald-400/20",
        chipBg: "bg-emerald-500/15",
        chipText: "text-emerald-300",
        dot: "bg-emerald-400",
      }
    : {
        ring: "ring-rose-400/20",
        chipBg: "bg-rose-500/15",
        chipText: "text-rose-300",
        dot: "bg-rose-400",
      };

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
            inativos={inativos}
          />
        </div>
        <div className="mt-3 flex justify-center">
          <div
            className={[
              "inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5",
              "px-3 py-2 text-white/90 shadow-sm backdrop-blur-sm",
              "ring-1",
              colors.ring,
            ].join(" ")}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <span className="text-xs text-white/60">{label}</span>
            <span className="text-lg font-semibold tracking-tight">
              {brl.format(totalSalario)}
            </span>
            <span
              className={`ml-1 rounded-md px-1.5 py-0.5 text-[10px] ${colors.chipBg} ${colors.chipText}`}
            >
              {inativos ? "Mensal" : "Desligamentos"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex align-middle mt-5 min-w-[1100px] relative w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
        {filtroAtivo && funcionariosFiltrados.length === 0 ? (
          <div className="flex justify-center p-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
              <SearchX size={16} className="opacity-80" />
              Nenhum funcionário encontrado
            </div>
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
            inativos={inativos}
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
        {inativos ? (
          <button
            onClick={buscaInativos}
            className="absolute botton right-6 cursor-pointer px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25"
          >
            Funcionários Desligados
          </button>
        ) : (
          <button
            onClick={buscaInativos}
            className="absolute botton right-6 cursor-pointer px-3 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-200 hover:bg-green-500/25"
          >
            Funcionários Admimitidos
          </button>
        )}
      </div>
    </div>
  );
}

export default Funcionarios;
