/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, Clock, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { getPontoHoje, registrarBatida } from "../services/api/pontoService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";

function Ponto() {
  const { mostrarAviso, limparAviso } = useAviso();
  const navigate = useNavigate();
  const { temPermissao } = usePermissao();

  const [carregando, setCarregando] = useState(false);
  const [pontoData, setPontoData] = useState(null);

  async function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarPontoHoje() {
    setCarregando(true);
    try {
      const data = await getPontoHoje();
      setPontoData(data);
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

  async function handleRegistrarPonto() {
    setCarregando(true);
    try {
      const resultado = await registrarBatida();
      mostrarAviso("sucesso", resultado.mensagem);
      setTimeout(() => {
        limparAviso();
        buscarPontoHoje();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  function formatarData(dataStr) {
    const data = new Date(dataStr + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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

  function formatarBancoHoras(horas) {
    const horasAbs = Math.abs(horas);
    const horasInteiras = Math.floor(horasAbs);
    const minutos = Math.round((horasAbs - horasInteiras) * 60);
    const sinal = horas >= 0 ? "+" : "-";
    return `${sinal}${horasInteiras}h${minutos.toString().padStart(2, "0")}min`;
  }

  useEffect(() => {
    buscarPontoHoje();
    document.title = "Ponto - Sistema RH";
  }, []);

  if (!pontoData) {
    return (
      <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
        <Background />
        {carregando && <Loading />}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      <button
        className="cursor-pointer absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      {carregando && <Loading />}

      <div className="overflow-x-hidden overflow-y-auto text-white w-full max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-semibold text-white mb-2 text-center">
            {pontoData.funcionario.nome}
          </h1>
          <p className="text-center text-white/70 mb-6 capitalize">
            {formatarData(pontoData.dataAtual)}
          </p>

          {/* Card de Banco de Horas em destaque */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-5 border border-indigo-500/30 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Wallet className="text-indigo-300" size={24} />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Saldo Banco de Horas</p>
                  <p
                    className={`text-2xl font-bold ${
                      pontoData.bancoHoras >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatarBancoHoras(pontoData.bancoHoras)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs">
                  {pontoData.bancoHoras >= 0
                    ? "Horas a compensar"
                    : "Horas devidas"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 text-sm mb-1">Jornada Prevista</p>
              <p className="text-2xl font-semibold text-white">
                {pontoData.jornadaPrevista}
              </p>
            </div>

            {pontoData.resumo && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {pontoData.resumo.status === "normal" ? (
                    <>
                      <CheckCircle className="text-green-400" size={20} />
                      <span className="text-green-400 font-semibold">
                        Normal
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-yellow-400" size={20} />
                      <span className="text-yellow-400 font-semibold">
                        Divergente
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {pontoData.resumo && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <p className="text-white/70 text-sm mb-1">Trabalhadas</p>
                <p className="text-xl font-semibold text-white">
                  {pontoData.resumo.horasTrabalhadas.toFixed(2)}h
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <p className="text-white/70 text-sm mb-1">Extras</p>
                <p className="text-xl font-semibold text-green-400">
                  {pontoData.resumo.horasExtras.toFixed(2)}h
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <p className="text-white/70 text-sm mb-1">Negativas</p>
                <p className="text-xl font-semibold text-red-400">
                  {pontoData.resumo.horasNegativas.toFixed(2)}h
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Batidas Registradas
            </h2>
            {pontoData.batidas.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                Nenhuma batida registrada hoje
              </p>
            ) : (
              <div className="space-y-2">
                {pontoData.batidas.map((batida, index) => (
                  <div
                    key={batida.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="text-white/70" size={20} />
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {batida.tipo === "entrada" ? "Entrada" : "Saída"}
                        </p>
                        <p className="text-white/70 text-sm">
                          {formatarHora(batida.dataHora)}
                        </p>
                      </div>
                    </div>
                    <span className="text-white/50 text-sm">#{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRegistrarPonto}
            disabled={carregando}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Clock size={20} />
            Registrar Ponto (
            {pontoData.proximaBatida === "entrada" ? "Entrada" : "Saída"})
          </button>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigate("/justificativa")}
              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold py-3 px-4 rounded-lg transition-colors border border-yellow-500/30"
            >
              Justificativas
            </button>
            <button
              onClick={() => navigate("/relatorio-mensal")}
              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-semibold py-3 px-4 rounded-lg transition-colors border border-purple-500/30"
            >
              Histórico
            </button>
          </div>

          {/* Botão de gestão para aprovadores */}
          {(temPermissao("ponto.aprovar_justificativas") ||
            temPermissao("ponto.alterar_batidas")) && (
            <div className="mt-4">
              <button
                onClick={() => navigate("/gerenciar-pontos")}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold py-3 px-4 rounded-lg transition-colors border border-emerald-500/30"
              >
                Gerenciar Pontos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ponto;
