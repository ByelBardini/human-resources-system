/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCargos, deleteCargo } from "../../services/api/cargoServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import { useAuthError } from "../../hooks/useAuthError.js";
import TabelaCargos from "../cargos/tabelaCargos.jsx";
import logger from "../../utils/logger.js";

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
  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();
  const [cargos, setCargos] = useState([{ niveis: [] }]);
  const [busca, setBusca] = useState("");

  const [selecionado, setSelecionado] = useState({ linha: null, campo: null });

  // Filtrar cargos baseado na busca
  const cargosFiltrados = busca.trim()
    ? cargos.filter((cargo) =>
        cargo.cargo_nome?.toLowerCase().includes(busca.toLowerCase().trim())
      )
    : cargos;

  // Paginação
  const tabelaContainerRef = useRef(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const ALTURA_LINHA = 48;
  const ALTURA_CABECALHO = 100;

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

  const listaParaPaginar = cargosFiltrados;
  const totalPaginas = Math.ceil(listaParaPaginar.length / itensPorPagina);

  const cargosPaginados = listaParaPaginar.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, cargos]);

  const irParaPaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(1, prev - 1));
  };

  const irParaProximaPagina = () => {
    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1));
  };

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
      if (isAuthError(err)) {
        handleAuthError(setCarregando);
        logger.error(err.message, err);
      } else if (err.status === 409) {
        setCarregando(false);
        setConfirmacao(false);
        logger.error(err.message, err);
        mostrarAviso(
          "erro",
          "Impossível excluir um cargo que já possua funcionários vinculados",
          true
        );
      } else {
        setCarregando(false);
        setConfirmacao(false);
        mostrarAviso("erro", err.message, true);
        logger.error(err);
      }
    }
  }

  function selecionaCampo(cargoId, campoId) {
    setSelecionado((prev) => {
      // Se clicar exatamente na mesma linha e campo, desseleciona
      if (prev.linha === cargoId && prev.campo === campoId) {
        return { linha: null, campo: null };
      }
      // Senão, seleciona a nova linha/campo
      return { linha: cargoId, campo: campoId };
    });
  }

  async function buscaCargos() {
    const empresa_id = localStorage.getItem("empresa_id");

    try {
      const cargos = await getCargos(empresa_id);
      setCargos(cargos);
    } catch (err) {
      mostrarAviso("erro", err.message);
      logger.error(err.message, err);
    }
  }

  useEffect(() => {
    buscaCargos();
    setModificado(false);
  }, [modificado]);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div
        ref={tabelaContainerRef}
        className={`relative w-full min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl ${listaParaPaginar.length > itensPorPagina ? 'flex-1' : ''}`}
      >
        <TabelaCargos
          cargos={cargosPaginados}
          cargosFiltro={[]}
          selecionado={selecionado}
          selecionaCampo={selecionaCampo}
          clicaDeleta={clicaDeleta}
          busca={busca}
          setBusca={setBusca}
        />
      </div>

      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          {totalPaginas > 1 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
              <button
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/80 transition-colors focus:outline-none"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-white/70 min-w-[80px] text-center">
                {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/80 transition-colors focus:outline-none"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
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

        <div className="flex-1" />
      </div>
    </div>
  );
}
