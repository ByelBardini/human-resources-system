/* eslint-disable react-hooks/exhaustive-deps */
import {
  LogOut,
  X,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Building2,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  getGestaoEmpresas,
  getGestaoFuncionarios,
  getHistoricoFuncionario,
  getPendentes,
  aprovarBatida,
  reprovarBatida,
  fecharBancoHoras,
  recalcularBancoHoras,
  exportarPontoExcel,
  exportarTodosPontosZip,
  getFuncionariosDesligados,
  getHistoricoFuncionarioDesligado,
} from "../services/api/pontoService.js";
import {
  aprovarJustificativa,
  recusarJustificativa,
} from "../services/api/justificativaService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { formatarHorasParaHHMM, formatarHorasComSinal } from "../utils/formatarHoras.js";

function GerenciarPontos() {
  const { mostrarAviso, limparAviso } = useAviso();
  const navigate = useNavigate();
  const { temPermissao } = usePermissao();

  const [carregando, setCarregando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("funcionarios");

  // Estados de empresas
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  // Estados de pendências
  const [pendentes, setPendentes] = useState({
    justificativas: [],
    batidas: [],
  });

  // Estados de funcionários
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [historicoFuncionario, setHistoricoFuncionario] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diaExpandido, setDiaExpandido] = useState(null);

  // Estados de funcionários desligados
  const [funcionariosDesligados, setFuncionariosDesligados] = useState([]);
  const [funcionarioDesligadoSelecionado, setFuncionarioDesligadoSelecionado] =
    useState(null);
  const [historicoFuncionarioDesligado, setHistoricoFuncionarioDesligado] =
    useState(null);

  // Modal de reprovação
  const [modalReprovar, setModalReprovar] = useState(null);
  const [motivoReprovar, setMotivoReprovar] = useState("");

  // Modal de fechar banco
  const [modalFecharBanco, setModalFecharBanco] = useState(false);

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

  const tiposJustificativa = {
    esqueceu_bater: "Esqueceu de bater ponto",
    entrada_atrasada: "Entrada atrasada",
    saida_cedo: "Saída cedo",
    falta_justificada: "Falta justificada",
    consulta_medica: "Consulta médica",
    horas_extras: "Horas Extras",
    outros: "Outros",
    falta_nao_justificada: "Falta não justificada",
  };

  async function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarEmpresas() {
    try {
      const data = await getGestaoEmpresas();
      setEmpresas(data.empresas);
    } catch (err) {
      mostrarAviso("erro", err.message, true);
    }
  }

  async function buscarPendentes() {
    setCarregando(true);
    try {
      const data = await getPendentes();
      setPendentes(data);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function buscarFuncionarios(empresaId = null) {
    setCarregando(true);
    try {
      const data = await getGestaoFuncionarios(empresaId);
      setFuncionarios(data.funcionarios);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function buscarHistoricoFuncionario(id) {
    setCarregando(true);
    try {
      const data = await getHistoricoFuncionario(id, mes, ano);
      setHistoricoFuncionario(data);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function buscarFuncionariosDesligados(empresaId = null) {
    setCarregando(true);
    try {
      const data = await getFuncionariosDesligados(empresaId);
      setFuncionariosDesligados(data.funcionarios);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function buscarHistoricoFuncionarioDesligado(id) {
    setCarregando(true);
    try {
      const data = await getHistoricoFuncionarioDesligado(id, mes, ano);
      setHistoricoFuncionarioDesligado(data);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleAprovarJustificativa(id) {
    setCarregando(true);
    try {
      await aprovarJustificativa(id);
      mostrarAviso("sucesso", "Justificativa aprovada com sucesso!");
      setTimeout(() => {
        limparAviso();
        buscarPendentes();
        if (funcionarioSelecionado) {
          buscarHistoricoFuncionario(funcionarioSelecionado.id);
        }
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleRecusarJustificativa(id) {
    setCarregando(true);
    try {
      await recusarJustificativa(id);
      mostrarAviso("sucesso", "Justificativa recusada!");
      setTimeout(() => {
        limparAviso();
        buscarPendentes();
        if (funcionarioSelecionado) {
          buscarHistoricoFuncionario(funcionarioSelecionado.id);
        }
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleAprovarBatida(id) {
    setCarregando(true);
    try {
      await aprovarBatida(id);
      mostrarAviso("sucesso", "Batida aprovada com sucesso!");
      setTimeout(() => {
        limparAviso();
        buscarPendentes();
        if (funcionarioSelecionado) {
          buscarHistoricoFuncionario(funcionarioSelecionado.id);
        }
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleReprovarBatida() {
    if (!modalReprovar) return;

    setCarregando(true);
    try {
      await reprovarBatida(modalReprovar.id, motivoReprovar);
      mostrarAviso("sucesso", "Batida reprovada!");
      setModalReprovar(null);
      setMotivoReprovar("");
      setTimeout(() => {
        limparAviso();
        buscarPendentes();
        if (funcionarioSelecionado) {
          buscarHistoricoFuncionario(funcionarioSelecionado.id);
        }
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleFecharBanco() {
    if (!funcionarioSelecionado) return;

    setCarregando(true);
    try {
      const result = await fecharBancoHoras(funcionarioSelecionado.id);
      mostrarAviso(
        "sucesso",
        `Banco de horas fechado! Saldo anterior: ${formatarHorasParaHHMM(result.saldoAnterior)}`
      );
      setModalFecharBanco(false);
      setTimeout(() => {
        limparAviso();
        buscarHistoricoFuncionario(funcionarioSelecionado.id);
      }, 1500);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleRecalcularBanco() {
    if (!funcionarioSelecionado) return;

    setCarregando(true);
    try {
      const result = await recalcularBancoHoras(funcionarioSelecionado.id);
      mostrarAviso(
        "sucesso",
        `Banco recalculado! Novo saldo: ${formatarHorasParaHHMM(result.saldoNovo)}`
      );
      setTimeout(() => {
        limparAviso();
        buscarHistoricoFuncionario(funcionarioSelecionado.id);
      }, 1500);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleExportarExcel() {
    if (!funcionarioSelecionado) return;

    setCarregando(true);
    try {
      await exportarPontoExcel(funcionarioSelecionado.id, mes, ano);
      setCarregando(false);
      mostrarAviso("sucesso", "Planilha exportada com sucesso!");
      setTimeout(() => {
        limparAviso();
      }, 2000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleExportarExcelDesligado() {
    if (!funcionarioDesligadoSelecionado) return;

    setCarregando(true);
    try {
      await exportarPontoExcel(funcionarioDesligadoSelecionado.id, mes, ano);
      setCarregando(false);
      mostrarAviso("sucesso", "Planilha exportada com sucesso!");
      setTimeout(() => {
        limparAviso();
      }, 2000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  async function handleExportarTodosPontos() {
    setCarregando(true);
    try {
      await exportarTodosPontosZip(mes, ano);
      setCarregando(false);
      mostrarAviso("sucesso", "Arquivo ZIP com todos os pontos exportado com sucesso!");
      setTimeout(() => {
        limparAviso();
      }, 2000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  function formatarData(dataStr) {
    if (!dataStr) return "";
    const data = new Date(dataStr + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  }

  function obterDiaSemanaAbrev(dataStr) {
    if (!dataStr) return "";
    const data = new Date(dataStr + "T12:00:00");
    const diaSemana = data.getDay();
    const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    return dias[diaSemana];
  }

  function formatarHora(dataHora) {
    const data = new Date(dataHora);
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarDataHora(dataHora) {
    const data = new Date(dataHora);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarBancoHoras(horas) {
    const horasAbs = Math.abs(horas);
    const horasInteiras = Math.floor(horasAbs);
    const minutos = Math.round((horasAbs - horasInteiras) * 60);
    const sinal = horas >= 0 ? "+" : "-";
    return `${sinal}${horasInteiras}h${minutos.toString().padStart(2, "0")}min`;
  }

  // Verificar se pode navegar para o mês anterior
  // O backend já filtra os dias corretamente (apenas após data de cadastro e antes de inativação)
  // Portanto, permitimos navegar para qualquer mês - o backend mostrará apenas os dias válidos
  function podeMesAnterior() {
    // Se for funcionário desligado, não pode ir além da data de desligamento
    if (historicoFuncionarioDesligado?.funcionario?.dataDesligamento) {
      const dataDesligamento = new Date(
        historicoFuncionarioDesligado.funcionario.dataDesligamento + "T12:00:00"
      );
      const mesDesligamento = dataDesligamento.getMonth() + 1;
      const anoDesligamento = dataDesligamento.getFullYear();

      // Não pode ir para antes do mês de desligamento
      if (ano < anoDesligamento) return true; // Pode ir antes do desligamento
      if (ano === anoDesligamento && mes <= mesDesligamento) return false;

      return true;
    }

    // Para usuários ativos, sempre permitir navegar para meses anteriores
    // O backend filtrará os dias antes da data de cadastro automaticamente
    return true;
  }

  // Verificar se pode navegar para o mês seguinte (não pode ir além do mês atual ou data de desligamento)
  function podeMesSeguinte() {
    // Se for funcionário desligado, não pode ir além da data de desligamento
    if (historicoFuncionarioDesligado?.funcionario?.dataDesligamento) {
      const dataDesligamento = new Date(
        historicoFuncionarioDesligado.funcionario.dataDesligamento + "T12:00:00"
      );
      const mesDesligamento = dataDesligamento.getMonth() + 1;
      const anoDesligamento = dataDesligamento.getFullYear();

      // Não pode ir além do mês de desligamento
      if (ano > anoDesligamento) return false;
      if (ano === anoDesligamento && mes >= mesDesligamento) return false;

      return true;
    }

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

  function selecionarFuncionario(func) {
    setFuncionarioSelecionado(func);
    setDiaExpandido(null);
  }

  function selecionarEmpresa(empresaId) {
    setEmpresaSelecionada(empresaId);
    setFuncionarioSelecionado(null);
    setHistoricoFuncionario(null);
    buscarFuncionarios(empresaId);
    
    // Se estiver na aba de desligados, buscar também
    if (abaAtiva === "desligados") {
      buscarFuncionariosDesligados(empresaId);
    }
  }

  function selecionarFuncionarioDesligado(func) {
    setFuncionarioDesligadoSelecionado(func);
    setDiaExpandido(null);
  }

  useEffect(() => {
    // Verificar permissão
    if (
      !temPermissao("ponto.aprovar_justificativas") &&
      !temPermissao("ponto.alterar_batidas")
    ) {
      navigate("/home", { replace: true });
      return;
    }

    buscarEmpresas();
    buscarPendentes();
    document.title = "Gerenciar Pontos - Sistema RH";
  }, []);

  useEffect(() => {
    if (funcionarioSelecionado) {
      buscarHistoricoFuncionario(funcionarioSelecionado.id);
    }
  }, [funcionarioSelecionado, mes, ano]);

  useEffect(() => {
    if (funcionarioDesligadoSelecionado) {
      buscarHistoricoFuncionarioDesligado(funcionarioDesligadoSelecionado.id);
    }
  }, [funcionarioDesligadoSelecionado, mes, ano]);

  useEffect(() => {
    if (abaAtiva === "desligados") {
      buscarFuncionariosDesligados(empresaSelecionada);
    }
  }, [abaAtiva, empresaSelecionada]);

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
        onClick={() => navigate("/home")}
      >
        <X size={20} />
      </button>

      {carregando && <Loading />}

      <div className="overflow-x-hidden overflow-y-auto text-white w-full max-w-6xl mt-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-white">
              Gerenciar Pontos
            </h1>
            <button
              onClick={handleExportarTodosPontos}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 transition-colors"
              title="Baixar todos os pontos de todas as empresas"
            >
              <Download size={18} />
              Baixar Todos os Pontos
            </button>
          </div>

          {/* Abas */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAbaAtiva("funcionarios")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                abaAtiva === "funcionarios"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <Users size={18} />
              Funcionários
            </button>
            <button
              onClick={() => {
                setAbaAtiva("pendentes");
                buscarPendentes();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                abaAtiva === "pendentes"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <AlertCircle size={18} />
              Pendências
              {(pendentes.justificativas.length > 0 ||
                pendentes.batidas.length > 0) && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                  {pendentes.justificativas.length + pendentes.batidas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setAbaAtiva("desligados");
                buscarFuncionariosDesligados(empresaSelecionada);
                setFuncionarioDesligadoSelecionado(null);
                setHistoricoFuncionarioDesligado(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                abaAtiva === "desligados"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <Users size={18} />
              Funcionários Desligados
            </button>
          </div>

          {/* Aba de Funcionários */}
          {abaAtiva === "funcionarios" && (
            <div className="space-y-4">
              {/* Seleção de Empresa */}
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Building2 size={20} />
                  Selecione a Empresa
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {empresas.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => selecionarEmpresa(emp.id)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        empresaSelecionada === emp.id
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                      }`}
                    >
                      <p className="font-medium truncate">{emp.nome}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Funcionários e Histórico */}
              {empresaSelecionada && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lista de Funcionários */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Funcionários
                    </h2>
                    {funcionarios.length === 0 ? (
                      <p className="text-white/50 text-center py-4">
                        Nenhum funcionário encontrado
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {funcionarios.map((func) => (
                          <button
                            key={func.id}
                            onClick={() => selecionarFuncionario(func)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              funcionarioSelecionado?.id === func.id
                                ? "bg-emerald-500/20 border border-emerald-500/30"
                                : "bg-white/5 hover:bg-white/10 border border-white/10"
                            }`}
                          >
                            <p className="text-white font-medium">
                              {func.nome}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Histórico do Funcionário */}
                  <div className="md:col-span-2 bg-white/5 rounded-lg border border-white/10 p-4">
                    {!funcionarioSelecionado ? (
                      <div className="flex items-center justify-center h-full text-white/50 py-8">
                        Selecione um funcionário para ver o histórico
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-white">
                            {funcionarioSelecionado.nome}
                          </h2>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => mudarMes(-1)}
                              disabled={!podeMesAnterior()}
                              className={`p-1 rounded ${
                                podeMesAnterior()
                                  ? "bg-white/5 hover:bg-white/10 text-white"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm min-w-[120px] text-center">
                              {meses[mes - 1]} {ano}
                            </span>
                            <button
                              onClick={() => mudarMes(1)}
                              disabled={!podeMesSeguinte()}
                              className={`p-1 rounded ${
                                podeMesSeguinte()
                                  ? "bg-white/5 hover:bg-white/10 text-white"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>

                        {historicoFuncionario && (
                          <>
                            {/* Banco de Horas e Ações */}
                            <div className="flex gap-4 mb-4">
                              <div className="flex-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-3 border border-indigo-500/30">
                                <p className="text-white/70 text-xs">
                                  Banco de Horas
                                </p>
                                <p
                                  className={`text-xl font-bold ${
                                    historicoFuncionario.bancoHoras >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {formatarBancoHoras(
                                    historicoFuncionario.bancoHoras
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleExportarExcel}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-sm"
                                  title="Exportar para Excel"
                                >
                                  <Download size={14} />
                                  Exportar
                                </button>
                                <button
                                  onClick={handleRecalcularBanco}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm"
                                  title="Recalcular Banco de Horas"
                                >
                                  <RefreshCw size={14} />
                                  Recalcular
                                </button>
                                <button
                                  onClick={() => setModalFecharBanco(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm"
                                  title="Zerar Banco de Horas"
                                >
                                  Zerar Banco
                                </button>
                              </div>
                            </div>

                            {/* Lista de Dias */}
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                              {historicoFuncionario.dias.map((dia) => {
                                const isExpanded = diaExpandido === dia.data;
                                const temBatidas =
                                  dia.batidas && dia.batidas.length > 0;

                                return (
                                  <div
                                    key={dia.data}
                                    className="bg-white/5 rounded border border-white/10"
                                  >
                                    <div
                                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                      onClick={() =>
                                        setDiaExpandido(
                                          isExpanded ? null : dia.data
                                        )
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-1">
                                            <span className="text-white text-sm w-12">
                                              {formatarData(dia.data).slice(0, 5)}
                                            </span>
                                            <span className="text-white/50 text-xs">
                                              {obterDiaSemanaAbrev(dia.data)}
                                            </span>
                                          </div>
                                          {dia.feriado && (
                                            <span className="text-purple-400 text-xs mt-0.5">
                                              {dia.feriado}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-white/70 text-xs">
                                          {formatarHorasParaHHMM(dia.horasTrabalhadas)}
                                        </span>
                                        {(() => {
                                          // Verificar status das justificativas
                                          const temJustAprovada = dia.justificativas?.some(j => j.justificativa_status === "aprovada");
                                          const temJustPendente = dia.justificativas?.some(j => j.justificativa_status === "pendente");
                                          const temJustRecusada = dia.justificativas?.some(j => j.justificativa_status === "recusada") && !temJustAprovada && !temJustPendente;
                                          
                                          if (temJustAprovada || temJustPendente) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                                Justificado
                                              </span>
                                            );
                                          } else if (temJustRecusada) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                                Justificado
                                              </span>
                                            );
                                          } else if (dia.status === "divergente" || dia.horasExtras > 0 || dia.horasNegativas > 0) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                                Div.
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {dia.saldoDia !== undefined && (
                                          <span className={`text-sm font-semibold ${dia.saldoDia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatarHorasComSinal(dia.saldoDia)}
                                          </span>
                                        )}
                                        {isExpanded ? (
                                          <ChevronUp
                                            size={14}
                                            className="text-white/50"
                                          />
                                        ) : (
                                          <ChevronDown
                                            size={14}
                                            className="text-white/50"
                                          />
                                        )}
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="border-t border-white/10 p-2 bg-white/5">
                                        {temBatidas ? (
                                          <div className="space-y-2">
                                            <p className="text-white/70 text-xs font-semibold mb-1">
                                              Batidas de Ponto:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {dia.batidas.map((b, idx) => (
                                                <div
                                                  key={idx}
                                                  className={`px-3 py-2 rounded-lg border ${
                                                    b.batida_status === "pendente"
                                                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                                                      : b.batida_status ===
                                                        "recusada"
                                                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                                                      : "bg-white/10 border-white/20 text-white"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                      {b.batida_tipo === "entrada"
                                                        ? "Entrada"
                                                        : "Saída"}
                                                    </span>
                                                    <span className="text-sm">
                                                      {formatarHora(
                                                        b.batida_data_hora
                                                      )}
                                                    </span>
                                                    {b.batida_status ===
                                                      "pendente" && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/30">
                                                        Pendente
                                                      </span>
                                                    )}
                                                    {b.batida_status ===
                                                      "recusada" && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/30">
                                                        Recusada
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-white/50 text-xs text-center py-2">
                                            Nenhuma batida registrada neste dia
                                          </p>
                                        )}

                                        {dia.justificativas &&
                                          dia.justificativas.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                              <p className="text-white/70 text-xs font-semibold mb-2">
                                                Justificativas:
                                              </p>
                                              <div className="space-y-1">
                                                {dia.justificativas.map(
                                                  (j, idx) => (
                                                    <div
                                                      key={idx}
                                                      className={`px-2 py-1 rounded text-xs ${
                                                        j.justificativa_status ===
                                                        "pendente"
                                                          ? "bg-orange-500/20 text-orange-400"
                                                          : j.justificativa_status ===
                                                            "aprovada"
                                                          ? "bg-green-500/20 text-green-400"
                                                          : "bg-red-500/20 text-red-400"
                                                      }`}
                                                    >
                                                      {tiposJustificativa[
                                                        j.justificativa_tipo
                                                      ] || j.justificativa_tipo}
                                                      {" - "}
                                                      {j.justificativa_status ===
                                                      "pendente"
                                                        ? "Pendente"
                                                        : j.justificativa_status ===
                                                          "aprovada"
                                                        ? "Aprovada"
                                                        : "Recusada"}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba de Pendências */}
          {abaAtiva === "pendentes" && (
            <div className="space-y-6">
              {/* Justificativas Pendentes */}
              {temPermissao("ponto.aprovar_justificativas") && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} />
                    Justificativas Pendentes ({pendentes.justificativas.length})
                  </h2>
                  {pendentes.justificativas.length === 0 ? (
                    <p className="text-white/50 text-center py-4">
                      Nenhuma justificativa pendente
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pendentes.justificativas.map((j) => (
                        <div
                          key={j.justificativa_id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-semibold">
                                {j.funcionario?.funcionario_nome ||
                                  "Funcionário"}
                              </p>
                              <p className="text-white/70 text-sm">
                                {formatarData(j.justificativa_data)} -{" "}
                                {tiposJustificativa[j.justificativa_tipo] ||
                                  j.justificativa_tipo}
                              </p>
                              {j.justificativa_descricao && (
                                <p className="text-white/50 text-sm mt-1">
                                  {j.justificativa_descricao}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAprovarJustificativa(j.justificativa_id)
                                }
                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                title="Aprovar"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRecusarJustificativa(j.justificativa_id)
                                }
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                title="Recusar"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Batidas Pendentes */}
              {temPermissao("ponto.alterar_batidas") && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Batidas Pendentes ({pendentes.batidas.length})
                  </h2>
                  {pendentes.batidas.length === 0 ? (
                    <p className="text-white/50 text-center py-4">
                      Nenhuma batida pendente
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pendentes.batidas.map((b) => (
                        <div
                          key={b.batida_id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-semibold">
                                {b.funcionario?.funcionario_nome ||
                                  "Funcionário"}
                              </p>
                              <p className="text-white/70 text-sm">
                                {formatarDataHora(b.batida_data_hora)} -{" "}
                                <span className="capitalize">
                                  {b.batida_tipo}
                                </span>
                              </p>
                              {b.batida_observacao && (
                                <p className="text-white/50 text-sm mt-1">
                                  Motivo: {b.batida_observacao}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAprovarBatida(b.batida_id)}
                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                title="Aprovar"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  setModalReprovar({
                                    id: b.batida_id,
                                    tipo: "batida",
                                  })
                                }
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                title="Reprovar"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Aba de Funcionários Desligados */}
          {abaAtiva === "desligados" && (
            <div className="space-y-4">
              {/* Seleção de Empresa */}
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Building2 size={20} />
                  Selecione a Empresa
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {empresas.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => selecionarEmpresa(emp.id)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        empresaSelecionada === emp.id
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                      }`}
                    >
                      <p className="font-medium truncate">{emp.nome}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Funcionários Desligados e Histórico */}
              {empresaSelecionada && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lista de Funcionários Desligados */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Funcionários Desligados
                    </h2>
                    {funcionariosDesligados.length === 0 ? (
                      <p className="text-white/50 text-center py-4">
                        Nenhum funcionário desligado encontrado
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {funcionariosDesligados.map((func) => (
                          <button
                            key={func.id}
                            onClick={() => selecionarFuncionarioDesligado(func)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              funcionarioDesligadoSelecionado?.id === func.id
                                ? "bg-emerald-500/20 border border-emerald-500/30"
                                : "bg-white/5 hover:bg-white/10 border border-white/10"
                            }`}
                          >
                            <p className="text-white font-medium">{func.nome}</p>
                            {func.data_desligamento && (
                              <p className="text-white/50 text-xs mt-1">
                                Desligado em: {formatarData(func.data_desligamento)}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Histórico do Funcionário Desligado */}
                  <div className="md:col-span-2 bg-white/5 rounded-lg border border-white/10 p-4">
                    {!funcionarioDesligadoSelecionado ? (
                      <div className="flex items-center justify-center h-full text-white/50 py-8">
                        Selecione um funcionário desligado para ver o histórico
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-lg font-semibold text-white">
                              {funcionarioDesligadoSelecionado.nome}
                            </h2>
                            {historicoFuncionarioDesligado?.funcionario
                              ?.dataDesligamento && (
                              <p className="text-white/50 text-sm mt-1">
                                Desligado em:{" "}
                                {formatarData(
                                  historicoFuncionarioDesligado.funcionario
                                    .dataDesligamento
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => mudarMes(-1)}
                              disabled={!podeMesAnterior()}
                              className={`p-1 rounded ${
                                podeMesAnterior()
                                  ? "bg-white/5 hover:bg-white/10 text-white"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm min-w-[120px] text-center">
                              {meses[mes - 1]} {ano}
                            </span>
                            <button
                              onClick={() => mudarMes(1)}
                              disabled={!podeMesSeguinte()}
                              className={`p-1 rounded ${
                                podeMesSeguinte()
                                  ? "bg-white/5 hover:bg-white/10 text-white"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>

                        {historicoFuncionarioDesligado && (
                          <>
                            {/* Botão de Download */}
                            <div className="flex gap-4 mb-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={handleExportarExcelDesligado}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-sm"
                                  title="Exportar para Excel"
                                >
                                  <Download size={14} />
                                  Exportar
                                </button>
                              </div>
                            </div>

                            {/* Lista de Dias */}
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                              {historicoFuncionarioDesligado.dias.map((dia) => {
                                const isExpanded = diaExpandido === dia.data;
                                const temBatidas =
                                  dia.batidas && dia.batidas.length > 0;

                                return (
                                  <div
                                    key={dia.data}
                                    className="bg-white/5 rounded border border-white/10"
                                  >
                                    <div
                                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                      onClick={() =>
                                        setDiaExpandido(
                                          isExpanded ? null : dia.data
                                        )
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-1">
                                            <span className="text-white text-sm w-12">
                                              {formatarData(dia.data).slice(0, 5)}
                                            </span>
                                            <span className="text-white/50 text-xs">
                                              {obterDiaSemanaAbrev(dia.data)}
                                            </span>
                                          </div>
                                          {dia.feriado && (
                                            <span className="text-purple-400 text-xs mt-0.5">
                                              {dia.feriado}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-white/70 text-xs">
                                          {formatarHorasParaHHMM(
                                            dia.horasTrabalhadas
                                          )}
                                        </span>
                                        {(() => {
                                          const temJustAprovada =
                                            dia.justificativas?.some(
                                              (j) =>
                                                j.justificativa_status ===
                                                "aprovada"
                                            );
                                          const temJustPendente =
                                            dia.justificativas?.some(
                                              (j) =>
                                                j.justificativa_status ===
                                                "pendente"
                                            );
                                          const temJustRecusada =
                                            dia.justificativas?.some(
                                              (j) =>
                                                j.justificativa_status ===
                                                "recusada"
                                            ) &&
                                            !temJustAprovada &&
                                            !temJustPendente;

                                          if (temJustAprovada || temJustPendente) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                                Justificado
                                              </span>
                                            );
                                          } else if (temJustRecusada) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                                Justificado
                                              </span>
                                            );
                                          } else if (
                                            dia.status === "divergente" ||
                                            dia.horasExtras > 0 ||
                                            dia.horasNegativas > 0
                                          ) {
                                            return (
                                              <span className="px-1 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                                Div.
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {dia.saldoDia !== undefined && (
                                          <span className={`text-sm font-semibold ${dia.saldoDia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatarHorasComSinal(dia.saldoDia)}
                                          </span>
                                        )}
                                        {isExpanded ? (
                                          <ChevronUp
                                            size={14}
                                            className="text-white/50"
                                          />
                                        ) : (
                                          <ChevronDown
                                            size={14}
                                            className="text-white/50"
                                          />
                                        )}
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="border-t border-white/10 p-2 bg-white/5">
                                        {temBatidas ? (
                                          <div className="space-y-2">
                                            <p className="text-white/70 text-xs font-semibold mb-1">
                                              Batidas de Ponto:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {dia.batidas.map((b, idx) => (
                                                <div
                                                  key={idx}
                                                  className={`px-3 py-2 rounded-lg border ${
                                                    b.batida_status === "pendente"
                                                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                                                      : b.batida_status ===
                                                        "recusada"
                                                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                                                      : "bg-white/10 border-white/20 text-white"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                      {b.batida_tipo === "entrada"
                                                        ? "Entrada"
                                                        : "Saída"}
                                                    </span>
                                                    <span className="text-sm">
                                                      {formatarHora(b.batida_data_hora)}
                                                    </span>
                                                    {b.batida_status ===
                                                      "pendente" && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/30">
                                                        Pendente
                                                      </span>
                                                    )}
                                                    {b.batida_status ===
                                                      "recusada" && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/30">
                                                        Recusada
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-white/50 text-xs text-center py-2">
                                            Nenhuma batida registrada neste dia
                                          </p>
                                        )}

                                        {dia.justificativas &&
                                          dia.justificativas.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                              <p className="text-white/70 text-xs font-semibold mb-2">
                                                Justificativas:
                                              </p>
                                              <div className="space-y-1">
                                                {dia.justificativas.map(
                                                  (j, idx) => (
                                                    <div
                                                      key={idx}
                                                      className={`px-2 py-1 rounded text-xs ${
                                                        j.justificativa_status ===
                                                        "pendente"
                                                          ? "bg-orange-500/20 text-orange-400"
                                                          : j.justificativa_status ===
                                                            "aprovada"
                                                          ? "bg-green-500/20 text-green-400"
                                                          : "bg-red-500/20 text-red-400"
                                                      }`}
                                                    >
                                                      {tiposJustificativa[
                                                        j.justificativa_tipo
                                                      ] || j.justificativa_tipo}
                                                      {" - "}
                                                      {j.justificativa_status ===
                                                      "pendente"
                                                        ? "Pendente"
                                                        : j.justificativa_status ===
                                                          "aprovada"
                                                        ? "Aprovada"
                                                        : "Recusada"}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Reprovar Batida */}
      {modalReprovar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Reprovar Batida
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Motivo da reprovação (opcional)
                </label>
                <textarea
                  value={motivoReprovar}
                  onChange={(e) => setMotivoReprovar(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2 text-white"
                  placeholder="Informe o motivo da reprovação..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setModalReprovar(null);
                    setMotivoReprovar("");
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReprovarBatida}
                  disabled={carregando}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Reprovar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fechar Banco de Horas */}
      {modalFecharBanco && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Fechar Banco de Horas
            </h2>
            <p className="text-white/70 mb-4">
              Tem certeza que deseja zerar o banco de horas de{" "}
              <strong className="text-white">
                {funcionarioSelecionado?.nome}
              </strong>
              ?
            </p>
            <p className="text-yellow-400 text-sm mb-4">
              ⚠️ Esta ação irá zerar o saldo do banco de horas. Use quando as
              horas forem compensadas ou pagas.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setModalFecharBanco(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFecharBanco}
                disabled={carregando}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GerenciarPontos;
