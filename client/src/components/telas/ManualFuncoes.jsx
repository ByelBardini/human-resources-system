/* eslint-disable react-hooks/exhaustive-deps */
import FiltrosDescricao from "../descricoes/FiltrosDescricao.jsx";
import TabelaDescricao from "../descricoes/TabelaDescricao.jsx";
import { useAviso } from "../../context/AvisoContext.jsx";
import { getDescricoes } from "../../services/api/descricaoService.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ManualFuncoes({
  setDesc,
  setModificaDesc,
  navigate,
  setModificado,
  modificado,
}) {
  const [descricoes, setDescricoes] = useState([]);
  const [setorFiltro, setSetorFiltro] = useState([]);
  const [cargoFiltro, setCargoFiltro] = useState([]);
  const [descricoesFiltradas, setDescricoesFiltradas] = useState([]);

  // Paginação
  const tabelaContainerRef = useRef(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const ALTURA_LINHA = 53; // py-3.5 (14px * 2) + conteúdo (~25px)
  const ALTURA_CABECALHO = 53; // header da tabela

  const { mostrarAviso, limparAviso } = useAviso();

  async function puxarDescricoes() {
    const id = localStorage.getItem("empresa_id");
    try {
      const descricoes = await getDescricoes(id);
      setDescricoes(descricoes);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        console.error(err.message, err);
        mostrarAviso(
          "erro",
          "Sessão inválida! Realize o Login novamente!",
          true
        );
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        console.error(err);
      }
    }
  }

  useEffect(() => {
    puxarDescricoes();
    setModificado(false);
  }, [modificado]);

  // Calcular itens por página baseado na altura disponível
  const calcularItensPorPagina = useCallback(() => {
    if (tabelaContainerRef.current) {
      const alturaDisponivel = tabelaContainerRef.current.clientHeight - ALTURA_CABECALHO;
      const itensCalculados = Math.floor(alturaDisponivel / ALTURA_LINHA);
      setItensPorPagina(Math.max(1, itensCalculados));
    }
  }, []);

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

  // Lista a ser paginada (filtrada ou completa)
  const listaParaPaginar = descricoesFiltradas.length > 0 ? descricoesFiltradas : descricoes;
  const totalPaginas = Math.ceil(listaParaPaginar.length / itensPorPagina);

  const descricoesPaginadas = listaParaPaginar.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Reset página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1);
  }, [descricoesFiltradas, descricoes]);

  const irParaPaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(1, prev - 1));
  };

  const irParaProximaPagina = () => {
    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1));
  };

  return (
    <div className="min-w-[1100px] w-full h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <FiltrosDescricao
          descricoes={descricoes}
          setorFiltro={setorFiltro}
          setSetorFiltro={setSetorFiltro}
          cargoFiltro={cargoFiltro}
          setCargoFiltro={setCargoFiltro}
          descricoesFiltradas={descricoesFiltradas}
          setDescricoesFiltradas={setDescricoesFiltradas}
        />
      </div>

      <div 
        ref={tabelaContainerRef} 
        className="mt-5 flex-1 min-h-0 flex flex-col"
      >
        <div className="flex-shrink-0 overflow-auto">
          <TabelaDescricao
            descricoes={descricoesPaginadas}
            setDesc={setDesc}
            setModificaDesc={setModificaDesc}
          />
        </div>

        {totalPaginas > 1 && (
          <div className="mt-auto flex-shrink-0 py-4 flex justify-center items-center gap-4">
            <button
              onClick={irParaPaginaAnterior}
              disabled={paginaAtual === 1}
              className="p-2 rounded-lg bg-white/10 border border-white/10 text-white/70 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-white/70">
              {paginaAtual} / {totalPaginas}
            </span>
            <button
              onClick={irParaProximaPagina}
              disabled={paginaAtual === totalPaginas}
              className="p-2 rounded-lg bg-white/10 border border-white/10 text-white/70 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManualFuncoes;
