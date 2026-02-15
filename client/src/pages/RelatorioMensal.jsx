/* eslint-disable react-hooks/exhaustive-deps */
import {
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Clock,
} from "lucide-react";
import {
  getRelatorioMensal,
  getTotaisMensais,
} from "../services/api/relatorioService.js";
import { adicionarBatida } from "../services/api/pontoService.js";
import { criarJustificativa } from "../services/api/justificativaService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import { useAuthError } from "../hooks/useAuthError.js";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { formatarHorasParaHHMM, formatarHorasComSinal } from "../utils/formatarHoras.js";
import { 
  formatarDataCurta, 
  formatarHora, 
  formatarBancoHoras as formatarBancoHorasUtil,
  obterDiaSemanaAbrev,
  formatarDataComDiaSemana 
} from "../utils/formatters.js";
import { storage } from "../hooks/useStorage.js";
import logger from "../utils/logger.js";

function RelatorioMensal() {
  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [totais, setTotais] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diaExpandido, setDiaExpandido] = useState(null);

  // Modal de adicionar batida
  const [modalBatida, setModalBatida] = useState(false);
  const [batidaData, setBatidaData] = useState(null);
  const [batidaTipo, setBatidaTipo] = useState("entrada");
  const [batidaHora, setBatidaHora] = useState("");
  const [batidaObservacao, setBatidaObservacao] = useState("");
  const [batidaAnexo, setBatidaAnexo] = useState(null);

  // Modal de justificativa
  const [modalJustificativa, setModalJustificativa] = useState(false);
  const [justificativaData, setJustificativaData] = useState(null);
  const [justificativaTipo, setJustificativaTipo] = useState("");
  const [justificativaDescricao, setJustificativaDescricao] = useState("");
  const [justificativaAnexo, setJustificativaAnexo] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null); // Armazena dados do dia (horasExtras, horasNegativas)

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Tipos de justificativa separados por contexto
  const tiposHorasNegativas = [
    { value: "falta_justificada", label: "Falta Justificada" },
    { value: "falta_nao_justificada", label: "Falta Não Justificada" },
  ];

  function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarRelatorio() {
    setCarregando(true);
    try {
      const [relatorioData, totaisData] = await Promise.all([
        getRelatorioMensal(mes, ano),
        getTotaisMensais(mes, ano),
      ]);
      setRelatorio(relatorioData);
      setTotais(totaisData);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError(setCarregando);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      logger.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdicionarBatida() {
    const exigeAnexo = relatorio?.info?.batidaForaEmpresa;
    if (!batidaHora || !batidaObservacao.trim()) {
      mostrarAviso("erro", "Hora e observação são obrigatórios", true);
      return;
    }
    if (exigeAnexo && !batidaAnexo) {
      mostrarAviso(
        "erro",
        "Anexo obrigatório para batida manual fora da empresa",
        true
      );
      return;
    }

    setCarregando(true);
    try {
      const dataHora = `${batidaData}T${batidaHora}:00`;
      await adicionarBatida(dataHora, batidaTipo, batidaObservacao, null, batidaAnexo);
      mostrarAviso("sucesso", "Batida registrada e aguardando aprovação!");
      setTimeout(() => {
        limparAviso();
        setModalBatida(false);
        setBatidaHora("");
        setBatidaObservacao("");
        setBatidaAnexo(null);
        buscarRelatorio();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      logger.error(err);
    }
  }

  async function handleCriarJustificativa() {
    // Validações baseadas no tipo de divergência
    const ehHorasNegativas = diaSelecionado && diaSelecionado.horasNegativas > 0;
    const ehHorasExtras = diaSelecionado && diaSelecionado.horasExtras > 0;

    if (ehHorasNegativas && !justificativaTipo) {
      mostrarAviso("erro", "Selecione o tipo de justificativa", true);
      return;
    }

    // Para horas negativas com falta justificada, descrição é obrigatória
    if (ehHorasNegativas && justificativaTipo === "falta_justificada" && !justificativaDescricao.trim()) {
      mostrarAviso("erro", "Descrição é obrigatória para falta justificada", true);
      return;
    }

    // Para horas extras, descrição é obrigatória
    if (ehHorasExtras && !justificativaDescricao.trim()) {
      mostrarAviso("erro", "Descrição é obrigatória para justificar horas extras", true);
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        data: justificativaData,
        tipo: ehHorasExtras ? "horas_extras" : justificativaTipo,
        descricao: justificativaDescricao,
      };
      await criarJustificativa(payload, justificativaAnexo);
      
      const mensagem = justificativaTipo === "falta_nao_justificada" 
        ? "Falta não justificada registrada!" 
        : "Justificativa criada com sucesso!";
      mostrarAviso("sucesso", mensagem);
      
      setTimeout(() => {
        limparAviso();
        fecharModalJustificativa();
        buscarRelatorio();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      logger.error(err);
    }
  }

  function fecharModalJustificativa() {
    setModalJustificativa(false);
    setJustificativaTipo("");
    setJustificativaDescricao("");
    setJustificativaAnexo(null);
    setDiaSelecionado(null);
  }

  // Usa funções importadas de formatters.js
  const formatarData = formatarDataCurta;
  const formatarSaldo = formatarHorasComSinal;
  const formatarBancoHoras = formatarBancoHorasUtil;

  // Verificar se pode navegar para o mês anterior (não pode ir antes da data de criação)
  function podeMesAnterior() {
    if (!relatorio?.info?.dataCriacao) return true;
    
    const dataCriacao = new Date(relatorio.info.dataCriacao + "T12:00:00");
    const mesCriacao = dataCriacao.getMonth() + 1;
    const anoCriacao = dataCriacao.getFullYear();
    
    // Não pode ir para antes do mês de criação
    if (ano < anoCriacao) return false;
    if (ano === anoCriacao && mes <= mesCriacao) return false;
    
    return true;
  }

  // Verificar se pode navegar para o mês seguinte (não pode ir além do mês atual)
  function podeMesSeguinte() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    
    // Não pode ir além do mês atual
    if (ano > anoAtual) return false;
    if (ano === anoAtual && mes >= mesAtual) return false;
    
    return true;
  }

  function mudarMes(direcao) {
    // Verificar se pode mudar na direção solicitada
    if (direcao === -1 && !podeMesAnterior()) return;
    if (direcao === 1 && !podeMesSeguinte()) return;

    let novoMes = mes + direcao;
    let novoAno = ano;

    if (novoMes > 12) {
      novoMes = 1;
      novoAno++;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno--;
    }

    setMes(novoMes);
    setAno(novoAno);
    setDiaExpandido(null);
  }

  function toggleDia(data) {
    setDiaExpandido(diaExpandido === data ? null : data);
  }

  function podeCriarJustificativa(dia) {
    if (dia.status !== "divergente") return false;
    const temJustificativaPendente = dia.justificativas.some(
      (j) => j.justificativa_status === "pendente"
    );
    return !temJustificativaPendente;
  }

  function getStatusJustificativa(dia) {
    if (dia.justificativas.length === 0) return null;
    const pendente = dia.justificativas.find(
      (j) => j.justificativa_status === "pendente"
    );
    if (pendente) return "pendente";
    const aprovada = dia.justificativas.find(
      (j) => j.justificativa_status === "aprovada"
    );
    if (aprovada) return "aprovada";
    return "recusada";
  }

  // Verifica se tem hora extra recusada (para mostrar aviso)
  function temHoraExtraRecusada(dia) {
    return dia.justificativas.some(
      (j) => j.justificativa_tipo === "horas_extras" && j.justificativa_status === "recusada"
    );
  }

  useEffect(() => {
    buscarRelatorio();
    document.title = "Histórico do Ponto - Atlas";
  }, [mes, ano]);

  return (
    <div className="relative min-h-[100dvh] w-screen flex justify-center items-start p-4 sm:p-6 pb-8 overflow-hidden">
      <Background />

      <button
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg z-10 touch-manipulation"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      <button
        className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg z-10 touch-manipulation"
        title="Voltar"
        onClick={() => navigate("/ponto", { replace: true })}
      >
        <X size={20} />
      </button>

      {carregando && <Loading />}

      <div className="relative z-10 overflow-x-hidden overflow-y-auto text-white w-full max-w-6xl mt-14 sm:mt-16 px-2 sm:px-4 pb-24 sm:pb-0">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-semibold text-white text-center sm:text-left">
              Histórico do Ponto
            </h1>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={() => mudarMes(-1)}
                disabled={!podeMesAnterior()}
                className={`p-2.5 sm:p-2 rounded-lg border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 touch-manipulation ${
                  podeMesAnterior()
                    ? "bg-white/5 hover:bg-white/10 active:scale-95 text-white"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-base sm:text-xl font-semibold min-w-[140px] sm:min-w-[180px] text-center">
                {meses[mes - 1]} {ano}
              </span>
              <button
                onClick={() => mudarMes(1)}
                disabled={!podeMesSeguinte()}
                className={`p-2.5 sm:p-2 rounded-lg border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 touch-manipulation ${
                  podeMesSeguinte()
                    ? "bg-white/5 hover:bg-white/10 active:scale-95 text-white"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {totais && (
            <>
              {/* Card de Banco de Horas em destaque */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-4 sm:p-5 border border-indigo-500/30 mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs sm:text-sm">
                      Saldo Total do Banco de Horas
                    </p>
                    <p
                      className={`text-2xl sm:text-3xl font-bold truncate ${
                        totais.bancoHoras >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatarBancoHoras(totais.bancoHoras)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">
                    Total Trabalhadas
                  </p>
                  <p className="text-lg sm:text-2xl font-semibold text-white truncate">
                    {formatarHorasParaHHMM(totais.horasTrabalhadas)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Total Extras</p>
                  <p className="text-lg sm:text-2xl font-semibold text-green-400 truncate">
                    {formatarHorasParaHHMM(totais.horasExtras)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">Dias Divergentes</p>
                  <p className="text-lg sm:text-2xl font-semibold text-yellow-400">
                    {totais.diasDivergentes}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">
                    Just. Pendentes
                  </p>
                  <p className="text-lg sm:text-2xl font-semibold text-yellow-400">
                    {totais.justificativasPendentes}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">
                    Just. Aprovadas
                  </p>
                  <p className="text-lg sm:text-2xl font-semibold text-green-400">
                    {totais.justificativasAprovadas}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-white/70 text-xs sm:text-sm mb-1">
                    Batidas Pendentes
                  </p>
                  <p className="text-lg sm:text-2xl font-semibold text-orange-400">
                    {totais.batidasPendentes || 0}
                  </p>
                </div>
              </div>
            </>
          )}

          {relatorio && (
            <div className="space-y-2">
              {relatorio.dias.map((dia) => {
                const isExpanded = diaExpandido === dia.data;
                const statusJust = getStatusJustificativa(dia);
                const horaExtraRecusada = temHoraExtraRecusada(dia);

                return (
                  <div
                    key={dia.data}
                    className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                  >
                    {/* Linha principal */}
                    <div
                      className="p-3 sm:p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 active:bg-white/5 transition-colors touch-manipulation"
                      onClick={() => toggleDia(dia.data)}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 flex-wrap">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold w-12 sm:w-16 text-sm sm:text-base">
                              {formatarData(dia.data)}
                            </span>
                            <span className="text-white/50 text-xs">
                              {obterDiaSemanaAbrev(dia.data)}
                            </span>
                          </div>
                          {dia.feriado && (
                            <span className="text-purple-400 text-xs mt-0.5 truncate max-w-[120px] sm:max-w-none">
                              {dia.feriado}
                            </span>
                          )}
                        </div>
                        <span className="text-white/70 w-16 sm:w-24 text-xs sm:text-base">
                          {formatarHorasParaHHMM(dia.horasTrabalhadas)} trab.
                        </span>
                        <span
                          className={`w-14 sm:w-20 font-semibold text-sm sm:text-base ${dia.saldoDia >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {formatarSaldo(dia.saldoDia)}
                        </span>
                        {(() => {
                          // Mostrar status baseado nas justificativas
                          if (statusJust === "pendente") {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                Just. Pendente
                              </span>
                            );
                          } else if (statusJust === "aprovada") {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                                Justificado
                              </span>
                            );
                          } else if (statusJust === "recusada") {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                                Justificado
                              </span>
                            );
                          } else if (dia.status === "divergente") {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Divergente
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-white/50 text-xs sm:text-sm hidden sm:inline">
                          {dia.batidas.length} batida(s)
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-white/50" />
                        ) : (
                          <ChevronDown size={20} className="text-white/50" />
                        )}
                      </div>
                    </div>

                    {/* Área expandida */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-3 sm:p-4 bg-white/5">
                        <p className="text-white/70 text-xs sm:text-sm mb-3 sm:mb-4 capitalize">
                          {formatarDataCompleta(dia.data)}
                        </p>

                        {/* Alerta de hora extra recusada */}
                        {horaExtraRecusada && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm font-medium">
                              ⚠️ Hora extra não aprovada
                            </p>
                            <p className="text-red-400/70 text-xs mt-1">
                              A justificativa de hora extra deste dia foi recusada. As horas extras continuam computadas, mas não foram aprovadas pelo gestor.
                            </p>
                          </div>
                        )}

                        {/* Batidas */}
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Clock size={16} />
                            Batidas do Dia
                          </h4>
                          {dia.batidas.length === 0 ? (
                            <p className="text-white/50 text-sm">
                              Nenhuma batida registrada
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {dia.batidas.map((batida, idx) => {
                                const alterada = Boolean(batida.alterada ?? batida.batida_alterada);
                                return (
                                  <div
                                    key={batida.id || idx}
                                    className={`p-2 rounded border ${
                                      alterada
                                        ? "bg-amber-500/10 border-amber-400/30"
                                        : batida.status === "pendente"
                                          ? "bg-orange-500/10 border-orange-500/30"
                                          : "bg-white/5 border-white/10"
                                    }`}
                                  >
                                    <p className="text-white text-sm font-medium capitalize">
                                      {batida.tipo}
                                    </p>
                                    <p className="text-white/70 text-xs">
                                      {formatarHora(batida.dataHora)}
                                    </p>
                                    {batida.status === "pendente" && (
                                      <p className="text-orange-400 text-xs mt-1">
                                        Aguardando aprovação
                                      </p>
                                    )}
                                    {alterada && (
                                      <p className="text-amber-400 text-xs font-medium mt-1">
                                        Horário alterado pelo RH
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Resumo do dia */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                          {dia.horasExtras > 0 && (
                            <div className="text-center">
                              <p className="text-white/50 text-xs">Extras</p>
                              <p className="text-green-400 font-semibold">
                                +{formatarHorasParaHHMM(dia.horasExtras)}
                              </p>
                            </div>
                          )}
                          {dia.horasNegativas > 0 && (
                            <div className="text-center">
                              <p className="text-white/50 text-xs">Negativas</p>
                              <p className="text-red-400 font-semibold">
                                -{formatarHorasParaHHMM(dia.horasNegativas)}
                              </p>
                            </div>
                          )}
                          <div className={`text-center ${dia.horasExtras > 0 && dia.horasNegativas > 0 ? 'col-span-1' : 'col-span-2'}`}>
                            <p className="text-white/50 text-xs">
                              Saldo do Dia
                            </p>
                            <p className={`font-semibold ${dia.saldoDia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatarSaldo(dia.saldoDia)}
                            </p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBatidaData(dia.data);
                              setModalBatida(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 active:scale-[0.98] text-blue-400 border border-blue-500/30 transition-all touch-manipulation min-h-[44px]"
                          >
                            <Plus size={16} />
                            Adicionar Batida
                          </button>
                          {podeCriarJustificativa(dia) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setJustificativaData(dia.data);
                                setDiaSelecionado({
                                  horasExtras: dia.horasExtras,
                                  horasNegativas: dia.horasNegativas,
                                });
                                setModalJustificativa(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 active:scale-[0.98] text-yellow-400 border border-yellow-500/30 transition-all touch-manipulation min-h-[44px]"
                            >
                              <FileText size={16} />
                              Justificar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar Batida */}
      {modalBatida && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-white/10 border-t sm:border p-4 sm:p-6 pb-8 sm:pb-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Adicionar Batida
            </h2>
            <p className="text-white/70 text-sm mb-4">
              Data: {formatarDataCompleta(batidaData)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Tipo</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batidaTipo === "entrada"}
                      onChange={() => setBatidaTipo("entrada")}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-white">Entrada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batidaTipo === "saida"}
                      onChange={() => setBatidaTipo("saida")}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-white">Saída</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Hora</label>
                <input
                  type="time"
                  value={batidaHora}
                  onChange={(e) => setBatidaHora(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Motivo (obrigatório)
                </label>
                <textarea
                  value={batidaObservacao}
                  onChange={(e) => setBatidaObservacao(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  placeholder="Explique o motivo da batida manual..."
                />
              </div>

              {relatorio?.info?.batidaForaEmpresa && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Anexo (obrigatório)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setBatidaAnexo(e.target.files?.[0] || null)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:cursor-pointer"
                    accept="image/*"
                  />
                </div>
              )}

              <p className="text-orange-400 text-sm">
                ⚠️ Esta batida ficará pendente até ser aprovada por um gestor.
              </p>

              <div className="flex gap-3 sm:gap-4 mt-6">
                <button
                  onClick={() => {
                    setModalBatida(false);
                    setBatidaHora("");
                    setBatidaObservacao("");
                    setBatidaAnexo(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all touch-manipulation min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarBatida}
                  disabled={carregando}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all touch-manipulation min-h-[48px]"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Justificativa */}
      {modalJustificativa && diaSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-white/10 border-t sm:border p-4 sm:p-6 pb-8 sm:pb-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {diaSelecionado.horasNegativas > 0 ? "Justificar Ausência" : "Justificar Horas Extras"}
            </h2>
            <p className="text-white/70 text-sm mb-4">
              Data: {formatarDataCompleta(justificativaData)}
            </p>

            <div className="space-y-4">
              {/* Para horas negativas: mostrar opções de falta */}
              {diaSelecionado.horasNegativas > 0 && (
                <>
                  <div>
                    <label className="block text-white/70 text-sm mb-3">
                      Tipo de Justificativa
                    </label>
                    <div className="space-y-2">
                      {tiposHorasNegativas.map((tipo) => (
                        <label
                          key={tipo.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            justificativaTipo === tipo.value
                              ? "bg-yellow-500/20 border-yellow-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name="tipoJustificativa"
                            value={tipo.value}
                            checked={justificativaTipo === tipo.value}
                            onChange={(e) => setJustificativaTipo(e.target.value)}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                          />
                          <div>
                            <span className="text-white font-medium">{tipo.label}</span>
                            {tipo.value === "falta_justificada" && (
                              <p className="text-white/50 text-xs mt-1">
                                Será enviado para aprovação. Se aprovado, o dia não será considerado como falta.
                              </p>
                            )}
                            {tipo.value === "falta_nao_justificada" && (
                              <p className="text-white/50 text-xs mt-1">
                                Não precisa de aprovação — é registrada e aprovada na hora. As horas negativas permanecem no banco de horas.
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {justificativaTipo === "falta_justificada" && (
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Descrição (obrigatória)
                      </label>
                      <textarea
                        value={justificativaDescricao}
                        onChange={(e) => setJustificativaDescricao(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        placeholder="Descreva o motivo da ausência..."
                      />
                    </div>
                  )}
                </>
              )}

              {/* Para horas extras: mostrar campo de justificativa */}
              {diaSelecionado.horasExtras > 0 && (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      Você realizou <strong>{formatarHorasParaHHMM(diaSelecionado.horasExtras)}</strong> extras neste dia.
                      Descreva o motivo para que seja aprovado.
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      Justificativa das Horas Extras (obrigatória)
                    </label>
                    <textarea
                      value={justificativaDescricao}
                      onChange={(e) => setJustificativaDescricao(e.target.value)}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="Descreva o motivo das horas extras realizadas..."
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      Anexo (opcional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setJustificativaAnexo(e.target.files[0] || null)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:cursor-pointer"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </div>

                  <p className="text-orange-400 text-sm">
                    ⚠️ Esta justificativa será enviada para aprovação.
                  </p>
                </>
              )}

              <div className="flex gap-3 sm:gap-4 mt-6">
                <button
                  onClick={fecharModalJustificativa}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all touch-manipulation min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarJustificativa}
                  disabled={carregando}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all touch-manipulation min-h-[48px]"
                >
                  {justificativaTipo === "falta_nao_justificada" ? "Registrar" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelatorioMensal;
