/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, Clock, CheckCircle, AlertCircle, Wallet, CalendarDays } from "lucide-react";
import { getPontoHoje, registrarBatida } from "../services/api/pontoService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import { useAuthError } from "../hooks/useAuthError.js";
import { usePermissao } from "../hooks/usePermissao.js";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import ModalTrocaSenha from "../components/usuarios/ModalTrocaSenha.jsx";
import { formatarHorasParaHHMM } from "../utils/formatarHoras.js";
import { 
  formatarHora, 
  formatarBancoHoras, 
  formatarDataCompleta as formatarData,
  formatarData as formatarDataCurta 
} from "../utils/formatters.js";
import { storage } from "../hooks/useStorage.js";
import logger from "../utils/logger.js";

function Ponto() {
  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();
  const navigate = useNavigate();
  const { temPermissao } = usePermissao();

  const [carregando, setCarregando] = useState(false);
  const [trocaSenha, setTrocaSenha] = useState(false);
  const [pontoData, setPontoData] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarPontoHoje() {
    setCarregando(true);
    try {
      const data = await getPontoHoje();
      setPontoData(data);
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

  async function handleRegistrarPonto() {
    if (pontoData?.emFerias) {
      mostrarAviso("erro", "Você está em férias e não pode registrar ponto.", true);
      return;
    }
    if (pontoData?.emAtestado) {
      mostrarAviso("erro", "Você está em período de atestado médico e não pode registrar ponto.", true);
      return;
    }
    if (pontoData?.funcionario?.batida_fora_empresa && !fotoFile) {
      mostrarAviso("erro", "Foto obrigatoria para registrar a batida.", true);
      return;
    }
    setCarregando(true);
    try {
      const resultado = await registrarBatida(fotoFile);
      mostrarAviso("sucesso", resultado.mensagem);
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      setFotoFile(null);
      setFotoPreview(null);
      setTimeout(() => {
        limparAviso();
        buscarPontoHoje();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      logger.error(err);
    }
  }

  function onSelectFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarAviso("erro", "Selecione apenas imagens para a foto.", true);
      return;
    }
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    const url = URL.createObjectURL(file);
    setFotoFile(file);
    setFotoPreview(url);
  }

  // Funções de formatação importadas de formatters.js

  useEffect(() => {
    setTrocaSenha(storage.deveTrocarSenha());
    document.title = "Ponto - Atlas";
  }, []);

  useEffect(() => {
    buscarPontoHoje();
  }, []);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  if (!pontoData) {
    return (
      <div className="relative min-h-[100dvh] w-screen flex justify-center items-center p-4 sm:p-6 overflow-hidden">
        <Background />
        {trocaSenha && (
          <ModalTrocaSenha
            setTrocaSenha={setTrocaSenha}
            setCarregando={setCarregando}
            navigate={navigate}
          />
        )}
        {carregando && <Loading />}
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-screen flex justify-center items-start sm:items-center p-4 sm:p-6 pb-8 overflow-hidden">
      <Background />

      {trocaSenha && (
        <ModalTrocaSenha
          setTrocaSenha={setTrocaSenha}
          setCarregando={setCarregando}
          navigate={navigate}
        />
      )}

      <button
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg z-10 touch-manipulation"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      {carregando && <Loading />}

      <div className="relative z-10 overflow-x-hidden overflow-y-auto text-white w-full max-w-2xl px-2 sm:px-4 pt-14 sm:pt-0 pb-24 sm:pb-0">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-semibold text-white mb-2 text-center break-words">
            {pontoData.funcionario.nome}
          </h1>
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-white/70 capitalize text-sm sm:text-base">
              {formatarData(pontoData.dataAtual)}
            </p>
            {pontoData.feriado && (
              <p className="text-purple-400 text-sm mt-1">
                {pontoData.feriado}
              </p>
            )}
            {pontoData.emFerias && pontoData.ferias && (
              <p className="text-amber-400 text-sm mt-1">
                Em férias: {formatarDataCurta(pontoData.ferias.data_inicio)} até{" "}
                {formatarDataCurta(pontoData.ferias.data_fim)}
              </p>
            )}
            {pontoData.emAtestado && pontoData.atestado && (
              <p className="text-sky-400 text-sm mt-1">
                Em atestado médico: {formatarDataCurta(pontoData.atestado.data_inicio)} até{" "}
                {formatarDataCurta(pontoData.atestado.data_fim)}
              </p>
            )}
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-4 sm:p-5 border border-indigo-500/30 mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 p-2 sm:p-3 bg-white/10 rounded-lg">
                  <Wallet className="text-indigo-300" size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs sm:text-sm">Saldo Banco de Horas</p>
                  <p
                    className={`text-lg sm:text-2xl font-bold truncate ${
                      pontoData.bancoHoras >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatarBancoHoras(pontoData.bancoHoras)}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-white/50 text-xs">
                  {pontoData.bancoHoras >= 0
                    ? "A compensar"
                    : "Devidas"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
              <p className="text-white/70 text-xs sm:text-sm mb-1">Jornada Prevista</p>
              <p className="text-xl sm:text-2xl font-semibold text-white">
                {pontoData.jornadaPrevista}
              </p>
            </div>

            {pontoData.resumo && (
              <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                <p className="text-white/70 text-xs sm:text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {pontoData.resumo.status === "normal" ? (
                    <>
                      <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                      <span className="text-green-400 font-semibold">
                        Normal
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 text-center">
                <p className="text-white/70 text-xs sm:text-sm mb-1">Trabalhadas</p>
                <p className="text-lg sm:text-xl font-semibold text-white">
                  {formatarHorasParaHHMM(pontoData.resumo.horasTrabalhadas)}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 text-center">
                <p className="text-white/70 text-xs sm:text-sm mb-1">Extras</p>
                <p className="text-lg sm:text-xl font-semibold text-green-400">
                  {formatarHorasParaHHMM(pontoData.resumo.horasExtras)}
                </p>
              </div>
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Batidas Registradas
            </h2>
            {pontoData.batidas.length === 0 ? (
              <p className="text-white/70 text-center py-4 text-sm sm:text-base">
                Nenhuma batida registrada hoje
              </p>
            ) : (
              <div className="space-y-2">
                {pontoData.batidas.map((batida, index) => {
                  const alterada = Boolean(batida.alterada ?? batida.batida_alterada);
                  return (
                    <div
                      key={batida.id}
                      className={`rounded-lg p-3 sm:p-4 border flex items-center justify-between gap-3 ${
                        alterada
                          ? "bg-amber-500/10 border-amber-400/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="text-white/70 flex-shrink-0" size={20} />
                        <div className="min-w-0">
                          <p className="text-white font-semibold capitalize text-sm sm:text-base">
                            {batida.tipo === "entrada" ? "Entrada" : "Saída"}
                          </p>
                          <p className="text-white/70 text-xs sm:text-sm">
                            {formatarHora(batida.dataHora)}
                          </p>
                          {alterada && (
                            <p className="text-amber-400 text-xs font-semibold mt-1.5">
                              Horário alterado pelo RH
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alterada && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/30 text-amber-300 border border-amber-400/40">
                            Alterado
                          </span>
                        )}
                        <span className="text-white/50 text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {pontoData.emFerias || pontoData.emAtestado ? (
            <div
              className={`w-full border rounded-lg p-6 text-center ${
                pontoData.emFerias
                  ? "bg-amber-500/20 border-amber-400/30"
                  : "bg-sky-500/20 border-sky-400/30"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <CalendarDays
                  className={pontoData.emFerias ? "text-amber-300" : "text-sky-300"}
                  size={32}
                />
                <div>
                  <p
                    className={`font-semibold text-lg mb-1 ${
                      pontoData.emFerias ? "text-amber-200" : "text-sky-200"
                    }`}
                  >
                    {pontoData.emFerias ? "Você está em férias" : "Você está em período de atestado médico"}
                  </p>
                  {pontoData.emFerias && pontoData.ferias && (
                    <p className="text-amber-300/80 text-sm">
                      Período: {formatarDataCurta(pontoData.ferias.data_inicio)} até{" "}
                      {formatarDataCurta(pontoData.ferias.data_fim)}
                    </p>
                  )}
                  {pontoData.emAtestado && pontoData.atestado && (
                    <p className="text-sky-300/80 text-sm">
                      Período: {formatarDataCurta(pontoData.atestado.data_inicio)} até{" "}
                      {formatarDataCurta(pontoData.atestado.data_fim)}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-2 ${
                      pontoData.emFerias ? "text-amber-200/70" : "text-sky-200/70"
                    }`}
                  >
                    Não é possível registrar ponto durante este período
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleRegistrarPonto}
                disabled={carregando}
                className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] disabled:bg-blue-500/50 text-white font-semibold py-4 sm:py-4 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[52px] text-base"
              >
                <Clock size={22} />
                Registrar Ponto (
                {pontoData.proximaBatida === "entrada" ? "Entrada" : "Saída"})
              </button>

              {pontoData.funcionario?.batida_fora_empresa && (
                <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                  <label className="block text-white/70 text-xs sm:text-sm mb-2">
                    Foto obrigatória da batida
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFoto}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-sm file:cursor-pointer touch-manipulation"
                  />
                  {fotoFile && (
                    <p className="mt-2 text-xs text-white/70 truncate">
                      Selecionado:{" "}
                      <span className="text-white/90">{fotoFile.name}</span>
                    </p>
                  )}
                  {fotoPreview && (
                    <div className="mt-3">
                      <img
                        src={fotoPreview}
                        alt="Pre-visualizacao"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover border border-white/10"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/justificativa")}
              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 active:scale-[0.98] text-yellow-400 font-semibold py-3 sm:py-3 px-4 rounded-xl transition-all border border-yellow-500/30 touch-manipulation min-h-[48px]"
            >
              Justificativas
            </button>
            <button
              onClick={() => navigate("/relatorio-mensal")}
              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 active:scale-[0.98] text-purple-400 font-semibold py-3 sm:py-3 px-4 rounded-xl transition-all border border-purple-500/30 touch-manipulation min-h-[48px]"
            >
              Histórico
            </button>
          </div>

          {(temPermissao("ponto.aprovar_justificativas") ||
            temPermissao("ponto.alterar_batidas")) && (
            <div className="mt-3 sm:mt-4 space-y-3">
              <button
                onClick={() => navigate("/gerenciar-pontos")}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-[0.98] text-emerald-400 font-semibold py-3 px-4 rounded-xl transition-all border border-emerald-500/30 touch-manipulation min-h-[48px]"
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
