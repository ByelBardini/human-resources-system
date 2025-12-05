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
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";

function RelatorioMensal() {
  const { mostrarAviso, limparAviso } = useAviso();
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

  async function deslogar() {
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
      setCarregando(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        setCarregando(false);
        mostrarAviso("erro", err.message, true);
      }
    }
  }

  async function handleAdicionarBatida() {
    if (!batidaHora || !batidaObservacao.trim()) {
      mostrarAviso("erro", "Hora e observação são obrigatórios", true);
      return;
    }

    setCarregando(true);
    try {
      const dataHora = `${batidaData}T${batidaHora}:00`;
      await adicionarBatida(dataHora, batidaTipo, batidaObservacao);
      mostrarAviso("sucesso", "Batida registrada e aguardando aprovação!");
      setTimeout(() => {
        limparAviso();
        setModalBatida(false);
        setBatidaHora("");
        setBatidaObservacao("");
        buscarRelatorio();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
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
    }
  }

  function fecharModalJustificativa() {
    setModalJustificativa(false);
    setJustificativaTipo("");
    setJustificativaDescricao("");
    setJustificativaAnexo(null);
    setDiaSelecionado(null);
  }

  function formatarData(dataStr) {
    const data = new Date(dataStr + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarDataCompleta(dataStr) {
    const data = new Date(dataStr + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarHora(dataHora) {
    const data = new Date(dataHora);
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarSaldo(saldo) {
    const sinalStr = saldo >= 0 ? "+" : "-";
    const saldoAbs = Math.abs(saldo);
    return `${sinalStr}${saldoAbs.toFixed(2)}h`;
  }

  function formatarBancoHoras(horas) {
    const horasAbs = Math.abs(horas);
    const horasInteiras = Math.floor(horasAbs);
    const minutos = Math.round((horasAbs - horasInteiras) * 60);
    const sinal = horas >= 0 ? "+" : "-";
    return `${sinal}${horasInteiras}h${minutos.toString().padStart(2, "0")}min`;
  }

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
    document.title = "Histórico do Ponto - Sistema RH";
  }, [mes, ano]);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-start p-6 overflow-hidden">
      <Background />

      <button
        className="cursor-pointer absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      <button
        className="cursor-pointer absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/ponto")}
      >
        <X size={20} />
      </button>

      {carregando && <Loading />}

      <div className="overflow-x-hidden overflow-y-auto text-white w-full max-w-6xl mt-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-white">
              Histórico do Ponto
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => mudarMes(-1)}
                disabled={!podeMesAnterior()}
                className={`p-2 rounded-lg border border-white/10 ${
                  podeMesAnterior()
                    ? "bg-white/5 hover:bg-white/10 text-white"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xl font-semibold min-w-[180px] text-center">
                {meses[mes - 1]} {ano}
              </span>
              <button
                onClick={() => mudarMes(1)}
                disabled={!podeMesSeguinte()}
                className={`p-2 rounded-lg border border-white/10 ${
                  podeMesSeguinte()
                    ? "bg-white/5 hover:bg-white/10 text-white"
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
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-5 border border-indigo-500/30 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">
                      Saldo Total do Banco de Horas
                    </p>
                    <p
                      className={`text-3xl font-bold ${
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">
                    Total Trabalhadas
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {totais.horasTrabalhadas.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Total Extras</p>
                  <p className="text-2xl font-semibold text-green-400">
                    {totais.horasExtras.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Total Negativas</p>
                  <p className="text-2xl font-semibold text-red-400">
                    {totais.horasNegativas.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Dias Divergentes</p>
                  <p className="text-2xl font-semibold text-yellow-400">
                    {totais.diasDivergentes}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">
                    Justificativas Pendentes
                  </p>
                  <p className="text-2xl font-semibold text-yellow-400">
                    {totais.justificativasPendentes}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">
                    Justificativas Aprovadas
                  </p>
                  <p className="text-2xl font-semibold text-green-400">
                    {totais.justificativasAprovadas}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/70 text-sm mb-1">
                    Batidas Pendentes
                  </p>
                  <p className="text-2xl font-semibold text-orange-400">
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
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleDia(dia.data)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-white font-semibold w-16">
                          {formatarData(dia.data)}
                        </span>
                        <span className="text-white/70 w-24">
                          {dia.horasTrabalhadas.toFixed(2)}h trab.
                        </span>
                        <span
                          className={`w-20 font-semibold ${
                            dia.saldoDia >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
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
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm">
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
                      <div className="border-t border-white/10 p-4 bg-white/5">
                        <p className="text-white/70 text-sm mb-4 capitalize">
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {dia.batidas.map((batida, idx) => (
                                <div
                                  key={batida.id || idx}
                                  className={`p-2 rounded border ${
                                    batida.status === "pendente"
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
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Resumo do dia */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-white/50 text-xs">Extras</p>
                            <p className="text-green-400 font-semibold">
                              +{dia.horasExtras.toFixed(2)}h
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/50 text-xs">Negativas</p>
                            <p className="text-red-400 font-semibold">
                              -{dia.horasNegativas.toFixed(2)}h
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/50 text-xs">
                              Saldo do Dia
                            </p>
                            <p
                              className={`font-semibold ${
                                dia.saldoDia >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatarSaldo(dia.saldoDia)}
                            </p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBatidaData(dia.data);
                              setModalBatida(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition-colors"
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
                              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
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

              <p className="text-orange-400 text-sm">
                ⚠️ Esta batida ficará pendente até ser aprovada por um gestor.
              </p>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setModalBatida(false);
                    setBatidaHora("");
                    setBatidaObservacao("");
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarBatida}
                  disabled={carregando}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
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
                                As horas negativas serão mantidas no banco de horas.
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
                      Você realizou <strong>{diaSelecionado.horasExtras.toFixed(2)}h</strong> extras neste dia.
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

              <div className="flex gap-4 mt-6">
                <button
                  onClick={fecharModalJustificativa}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarJustificativa}
                  disabled={carregando}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
