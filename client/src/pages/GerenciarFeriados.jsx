/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFeriados } from "../services/api/feriadoService.js";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import ModalFeriado from "../components/feriados/ModalFeriado.jsx";

function GerenciarFeriados() {
  const navigate = useNavigate();

  const [feriados, setFeriados] = useState([]);
  const [feriadoSelecionado, setFeriadoSelecionado] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [atualizado, setAtualizado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();
  const { temPermissao } = usePermissao();

  async function buscaFeriados() {
    setCarregando(true);
    try {
      const feriadosData = await getFeriados();
      setFeriados(feriadosData);
      setAtualizado(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", "Erro ao buscar feriados:", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  function abrirModalCriar() {
    setFeriadoSelecionado(null);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirModalEditar(feriado) {
    setFeriadoSelecionado(feriado);
    setModoEdicao(true);
    setModalAberto(true);
  }

  useEffect(() => {
    if (!temPermissao("sistema.gerenciar_feriados")) {
      mostrarAviso("erro", "Você não tem permissão para acessar esta página!");
      navigate("/home", { replace: true });
      return;
    }

    buscaFeriados();
    document.title = "Gerenciar Feriados - Atlas";
  }, [atualizado]);

  function formatarData(data) {
    if (!data) return "";
    const date = new Date(data + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {modalAberto && (
        <ModalFeriado
          feriado={feriadoSelecionado}
          modoEdicao={modoEdicao}
          setModalAberto={setModalAberto}
          setCarregando={setCarregando}
          setAtualizado={setAtualizado}
          navigate={navigate}
        />
      )}

      {carregando && <Loading />}

      <button
        className="absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/home", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="relative z-10 text-white flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <Calendar size={20} className="text-blue-300" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Gerenciar Feriados
              </h1>
            </div>
            <button
              onClick={abrirModalCriar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
            >
              Novo Feriado
            </button>
          </div>

          <p className="text-sm text-white/60 mb-4">
            Gerencie os feriados de todas as empresas
          </p>

          <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {feriados.map((feriado) => (
              <div
                key={feriado.feriado_id}
                className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {feriado.feriado_nome}
                  </h3>
                  <p className="text-sm text-white/60">
                    {formatarData(feriado.feriado_data)}
                    {feriado.empresas && feriado.empresas.length > 0 && (
                      <span> - {feriado.empresas.map((e) => e.empresa_nome).join(", ")}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEditar(feriado)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/30 border border-blue-400/50 text-blue-200 hover:bg-blue-500/40 transition text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {feriados.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum feriado encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GerenciarFeriados;
