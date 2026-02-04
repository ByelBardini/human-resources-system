/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, X } from "lucide-react";
import { listarJustificativas, criarJustificativa } from "../services/api/justificativaService.js";
import { getRelatorioMensal } from "../services/api/relatorioService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { formatarHorasParaHHMM } from "../utils/formatarHoras.js";

function Justificativa() {
  const { mostrarAviso, limparAviso } = useAviso();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(false);
  const [diasDivergentes, setDiasDivergentes] = useState([]);
  const [justificativas, setJustificativas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [dadosDiaSelecionado, setDadosDiaSelecionado] = useState(null); // Armazena horasExtras e horasNegativas
  const [tipoJustificativa, setTipoJustificativa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState(null);

  // Tipos para horas negativas
  const tiposHorasNegativas = [
    { value: "falta_justificada", label: "Falta Justificada" },
    { value: "atestado", label: "Atestado" },
    { value: "falta_nao_justificada", label: "Falta Não Justificada" },
  ];

  // Para listagem de justificativas enviadas
  const tiposJustificativaLabels = {
    esqueceu_bater: "Esqueceu de bater ponto",
    entrada_atrasada: "Entrada atrasada",
    saida_cedo: "Saída cedo",
    falta_justificada: "Falta justificada",
    consulta_medica: "Consulta médica",
    horas_extras: "Horas Extras",
    outros: "Outros",
    falta_nao_justificada: "Falta não justificada",
    atestado: "Atestado",
  };

  function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarDados() {
    setCarregando(true);
    try {
      const agora = new Date();
      const mesAtual = agora.getMonth() + 1;
      const anoAtual = agora.getFullYear();

      // Buscar mês atual + últimos 11 meses (12 meses no total) para que todos os dias divergentes apareçam para justificação
      const MESES_PARA_BUSCAR = 12;
      const mesesAnos = [];
      let mes = mesAtual;
      let ano = anoAtual;
      for (let i = 0; i < MESES_PARA_BUSCAR; i++) {
        mesesAnos.push({ mes, ano });
        mes--;
        if (mes < 1) {
          mes = 12;
          ano--;
        }
      }

      const promisesRelatorio = mesesAnos.map(({ mes: m, ano: a }) => getRelatorioMensal(m, a));
      const promisesJustificativas = mesesAnos.map(({ mes: m, ano: a }) => listarJustificativas(m, a));

      const resultadosRelatorios = await Promise.all(promisesRelatorio);
      const resultadosJustificativas = await Promise.all(promisesJustificativas);

      // Mínimo de 1 minuto para considerar que há horas a justificar (evita valores 0,0001 que exibem "00:00")
      const MIN_HORAS_PARA_JUSTIFICAR = 1 / 60;

      function temHorasAJustificar(dia) {
        const extras = Number(dia.horasExtras ?? dia.horas_extras ?? 0) || 0;
        const negativas = Number(dia.horasNegativas ?? dia.horas_negativas ?? 0) || 0;
        return extras >= MIN_HORAS_PARA_JUSTIFICAR || negativas >= MIN_HORAS_PARA_JUSTIFICAR;
      }

      const diasDiv = [];
      resultadosRelatorios.forEach((relatorioData) => {
        const dias = (relatorioData.dias || []).filter(
          (dia) => dia.status === "divergente" && temHorasAJustificar(dia)
        );
        diasDiv.push(...dias);
      });
      diasDiv.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

      const todasJustificativas = [];
      resultadosJustificativas.forEach((data) => {
        todasJustificativas.push(...(data.justificativas || []));
      });

      // Exibir apenas dias divergentes que ainda não possuem justificativa e que tenham horas a justificar
      const diasPendentes = diasDiv.filter((dia) => {
        if (todasJustificativas.some((j) => j.justificativa_data === dia.data)) return false;
        return temHorasAJustificar(dia);
      });
      setDiasDivergentes(diasPendentes);
      setJustificativas(todasJustificativas);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriarJustificativa() {
    const ehHorasNegativas = dadosDiaSelecionado && dadosDiaSelecionado.horasNegativas > 0;
    const ehHorasExtras = dadosDiaSelecionado && dadosDiaSelecionado.horasExtras > 0;

    if (ehHorasNegativas && !tipoJustificativa) {
      mostrarAviso("erro", "Selecione o tipo de justificativa", true);
      return;
    }

    // Para horas negativas com falta justificada, descrição é obrigatória
    if (ehHorasNegativas && tipoJustificativa === "falta_justificada" && !descricao.trim()) {
      mostrarAviso("erro", "Descrição é obrigatória para falta justificada", true);
      return;
    }

    // Para atestado, anexo é obrigatório
    if (ehHorasNegativas && tipoJustificativa === "atestado" && !anexo) {
      mostrarAviso("erro", "Anexo do atestado médico é obrigatório", true);
      return;
    }

    // Para horas extras, descrição é obrigatória
    if (ehHorasExtras && !descricao.trim()) {
      mostrarAviso("erro", "Descrição é obrigatória para justificar horas extras", true);
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        data: diaSelecionado,
        tipo: ehHorasExtras ? "horas_extras" : tipoJustificativa,
        descricao: descricao,
      };

      const anexoEnviar = ehHorasExtras || tipoJustificativa === "atestado" || tipoJustificativa === "falta_justificada" ? anexo : null;
      await criarJustificativa(payload, anexoEnviar);
      
      const mensagem =
        tipoJustificativa === "falta_nao_justificada"
          ? "Falta não justificada registrada!"
          : tipoJustificativa === "atestado"
            ? "Atestado enviado para aprovação!"
            : "Justificativa criada com sucesso!";
      mostrarAviso("sucesso", mensagem);
      
      setTimeout(() => {
        limparAviso();
        fecharModal();
        buscarDados();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      console.error(err);
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setDiaSelecionado(null);
    setDadosDiaSelecionado(null);
    setTipoJustificativa("");
    setDescricao("");
    setAnexo(null);
  }

  function formatarData(dataStr) {
    const data = new Date(dataStr + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case "pendente":
        return "text-yellow-400";
      case "aprovada":
        return "text-green-400";
      case "recusada":
        return "text-red-400";
      default:
        return "text-white/70";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aprovada":
        return "Aprovada";
      case "recusada":
        return "Recusada";
      default:
        return status;
    }
  }

  useEffect(() => {
    buscarDados();
    document.title = "Justificativas - Sistema RH";
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      <button
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      <button
        className="absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/ponto", { replace: true })}
      >
        <X size={20} />
      </button>

      {carregando && <Loading />}

      <div className="relative z-10 overflow-x-hidden overflow-y-auto text-white w-full max-w-4xl px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">
            Justificativas
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Dias Divergentes</h2>
            <p className="text-white/60 text-sm mb-4">
              Todos os dias divergentes dos últimos 12 meses aparecem abaixo. Cada um deve ser justificado.
            </p>
            {diasDivergentes.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                Nenhum dia divergente encontrado nos últimos 12 meses
              </p>
            ) : (
              <div className="space-y-2">
                {diasDivergentes.map((dia) => (
                  <div
                    key={dia.data}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-semibold">{formatarData(dia.data)}</p>
                      <div className="text-white/70 text-sm space-y-0.5">
                        {(dia.horasExtras ?? dia.horas_extras) > 0 && (
                          <p>Extras: {formatarHorasParaHHMM(dia.horasExtras ?? dia.horas_extras ?? 0)}</p>
                        )}
                        {(dia.horasNegativas ?? dia.horas_negativas) > 0 && (
                          <p className="text-red-300">Negativas: -{formatarHorasParaHHMM(dia.horasNegativas ?? dia.horas_negativas ?? 0)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDiaSelecionado(dia.data);
                        setDadosDiaSelecionado({
                          horasExtras: dia.horasExtras,
                          horasNegativas: dia.horasNegativas,
                        });
                        setMostrarModal(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      Justificar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Justificativas Enviadas</h2>
            {justificativas.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                Nenhuma justificativa enviada
              </p>
            ) : (
              <div className="space-y-2">
                {justificativas.map((j) => (
                  <div
                    key={j.justificativa_id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold">
                        {formatarData(j.justificativa_data)}
                      </p>
                      <span className={getStatusColor(j.justificativa_status)}>
                        {getStatusLabel(j.justificativa_status)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-1">
                      Tipo: {tiposJustificativaLabels[j.justificativa_tipo] || j.justificativa_tipo}
                    </p>
                    {j.justificativa_descricao && (
                      <p className="text-white/70 text-sm">{j.justificativa_descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarModal && dadosDiaSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {dadosDiaSelecionado.horasNegativas > 0 ? "Justificar Ausência" : "Justificar Horas Extras"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Data</label>
                <input
                  type="text"
                  value={formatarData(diaSelecionado)}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>

              {/* Para horas negativas: mostrar opções de falta */}
              {dadosDiaSelecionado.horasNegativas > 0 && (
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
                            tipoJustificativa === tipo.value
                              ? "bg-yellow-500/20 border-yellow-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name="tipoJustificativa"
                            value={tipo.value}
                            checked={tipoJustificativa === tipo.value}
                            onChange={(e) => setTipoJustificativa(e.target.value)}
                            className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                          />
                          <div>
                            <span className="text-white font-medium">{tipo.label}</span>
                            {tipo.value === "falta_justificada" && (
                              <p className="text-white/50 text-xs mt-1">
                                Será enviado para aprovação. Se aprovado, o dia não será considerado como falta.
                              </p>
                            )}
                            {tipo.value === "atestado" && (
                              <p className="text-white/50 text-xs mt-1">
                                Envie o atestado médico em anexo. Será enviado para aprovação.
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

                  {tipoJustificativa === "falta_justificada" && (
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Descrição (obrigatória)
                      </label>
                      <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        placeholder="Descreva o motivo da ausência..."
                      />
                    </div>
                  )}

                  {tipoJustificativa === "atestado" && (
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Anexo do atestado médico (obrigatório)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setAnexo(e.target.files[0] || null)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:cursor-pointer"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={2}
                        className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        placeholder="Descrição (opcional)"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Para horas extras: mostrar campo de justificativa */}
              {dadosDiaSelecionado.horasExtras > 0 && (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      Você realizou <strong>{formatarHorasParaHHMM(dadosDiaSelecionado.horasExtras)}</strong> extras neste dia.
                      Descreva o motivo para que seja aprovado.
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">
                      Justificativa das Horas Extras (obrigatória)
                    </label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
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
                      onChange={(e) => setAnexo(e.target.files[0] || null)}
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
                  onClick={fecharModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarJustificativa}
                  disabled={carregando}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {tipoJustificativa === "falta_nao_justificada"
                    ? "Registrar"
                    : tipoJustificativa === "atestado"
                      ? "Enviar Atestado"
                      : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Justificativa;

