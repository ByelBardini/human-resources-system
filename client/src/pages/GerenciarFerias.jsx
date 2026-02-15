/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFerias } from "../services/api/feriasService.js";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import ModalFerias from "../components/ferias/ModalFerias.jsx";

function GerenciarFerias() {
  const navigate = useNavigate();

  const [ferias, setFerias] = useState([]);
  const [feriasSelecionada, setFeriasSelecionada] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [atualizado, setAtualizado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();
  const { temPermissao } = usePermissao();

  async function buscarFerias() {
    setCarregando(true);
    try {
      const feriasData = await getFerias();
      setFerias(feriasData);
      setAtualizado(false);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message || "Erro ao buscar férias", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  function abrirModalCriar() {
    setFeriasSelecionada(null);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirModalEditar(item) {
    setFeriasSelecionada(item);
    setModoEdicao(true);
    setModalAberto(true);
  }

  useEffect(() => {
    if (!temPermissao("sistema.gerenciar_ferias")) {
      mostrarAviso("erro", "Você não tem permissão para acessar esta página!");
      navigate("/home", { replace: true });
      return;
    }

    buscarFerias();
    document.title = "Gerenciar Férias - Atlas";
  }, [atualizado]);

  function formatarData(data) {
    if (!data) return "";
    const date = new Date(data + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  }

  function obterNomeUsuario(item) {
    return (
      item?.usuario?.usuario_nome ||
      item?.funcionario?.funcionario_nome ||
      "Usuário não informado"
    );
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {modalAberto && (
        <ModalFerias
          ferias={feriasSelecionada}
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
                <CalendarDays size={20} className="text-blue-300" />
              </div>
              <h1 className="text-xl font-semibold text-white">
                Gerenciar Férias
              </h1>
            </div>
            <button
              onClick={abrirModalCriar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
            >
              Novo Período
            </button>
          </div>

          <p className="text-sm text-white/60 mb-4">
            Cadastre períodos de férias por usuário
          </p>

          <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {ferias.map((item) => (
              <div
                key={item.ferias_id}
                className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {obterNomeUsuario(item)}
                  </h3>
                  <p className="text-sm text-white/60">
                    {formatarData(item.ferias_data_inicio)} até{" "}
                    {formatarData(item.ferias_data_fim)}
                  </p>
                  {item.usuario?.empresa?.empresa_nome && (
                    <p className="text-xs text-white/50 mt-1">
                      {item.usuario.empresa.empresa_nome}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEditar(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 transition text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {ferias.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum período de férias encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GerenciarFerias;
