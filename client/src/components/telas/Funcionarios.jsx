/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useCallback } from "react";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import TabelaFuncionarios from "../funcionarios/TabelaFuncionarios.jsx";
import FiltrosFuncionarios from "../funcionarios/FiltroFuncionarios.jsx";

function Funcionarios({
  setAdicionandoFunc,
  setCardFuncionario,
  modificado,
  setModificado,
  navigate,
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

  // Paginação
  const tabelaContainerRef = useRef(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const ALTURA_LINHA = 41; // altura aproximada de cada linha da tabela (py-2 + conteúdo)
  const ALTURA_CABECALHO = 48; // altura do cabeçalho da tabela

  // Calcula itens por página baseado na altura disponível
  const calcularItensPorPagina = useCallback(() => {
    if (tabelaContainerRef.current) {
      const alturaDisponivel = tabelaContainerRef.current.clientHeight - ALTURA_CABECALHO;
      const itensCalculados = Math.floor(alturaDisponivel / ALTURA_LINHA);
      setItensPorPagina(Math.max(1, itensCalculados));
    }
  }, []);

  // Observer para recalcular quando o tamanho da tela mudar
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      calcularItensPorPagina();
    });

    if (tabelaContainerRef.current) {
      resizeObserver.observe(tabelaContainerRef.current);
      calcularItensPorPagina();
    }

    return () => resizeObserver.disconnect();
  }, [calcularItensPorPagina]);

  // Lista de funcionários a ser paginada
  const listaParaPaginar = funcionariosFiltrados.length ? funcionariosFiltrados : funcionarios;
  const totalPaginas = Math.ceil(listaParaPaginar.length / itensPorPagina);

  // Funcionários da página atual
  const funcionariosPaginados = listaParaPaginar.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Resetar página quando filtros mudam ou lista muda
  useEffect(() => {
    setPaginaAtual(1);
  }, [funcionariosFiltrados, funcionarios, inativos]);

  const irParaPaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(1, prev - 1));
  };

  const irParaProximaPagina = () => {
    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1));
  };

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
    <div className="min-w-[1100px] w-full h-full flex flex-col overflow-hidden">
      <div className="rounded-lg border border-white/10 transition-colors text-xl bg-white/5 backdrop-blur-xl p-2 flex-shrink-0">
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
      <div
        ref={tabelaContainerRef}
        className="flex align-middle mt-5 min-w-[1100px] relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl flex-1 min-h-0"
      >
        {filtroAtivo && funcionariosFiltrados.length === 0 ? (
          <div className="flex justify-center p-2 h-full w-full">
            <div className="inline-flex text-center items-center gap-2 rounded-lg px-4 py-3 text-white/70">
              <SearchX size={16} className="opacity-80" />
              Nenhum funcionário encontrado
            </div>
          </div>
        ) : (
          <TabelaFuncionarios
            funcionarios={funcionariosPaginados}
            setFuncionarios={setFuncionarios}
            setCardFuncionario={setCardFuncionario}
            setModificado={setModificado}
            modificado={modificado}
            inativos={inativos}
            navigate={navigate}
          />
        )}
      </div>
      <div className="mt-5 flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          {/* Controles de paginação à esquerda */}
          {totalPaginas > 1 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
              <button
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-white/70 min-w-[80px] text-center">
                {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setAdicionandoFunc(true)}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Adicionar Funcionário
        </button>
        <div className="flex-1 flex justify-end">
          {inativos ? (
            <button
              onClick={buscaInativos}
              className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Funcionários Desligados
            </button>
          ) : (
            <button
              onClick={buscaInativos}
              className="px-3 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-200 hover:bg-green-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Funcionários Admitidos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Funcionarios;
