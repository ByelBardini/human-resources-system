/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, FileText, Upload, X } from "lucide-react";
import { listarJustificativas, criarJustificativa } from "../services/api/justificativaService.js";
import { getRelatorioMensal } from "../services/api/relatorioService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";

function Justificativa() {
  const { mostrarAviso, limparAviso } = useAviso();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(false);
  const [diasDivergentes, setDiasDivergentes] = useState([]);
  const [justificativas, setJustificativas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [tipoJustificativa, setTipoJustificativa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState(null);

  const tiposJustificativa = [
    { value: "esqueceu_bater", label: "Esqueceu de bater ponto" },
    { value: "entrada_atrasada", label: "Entrada atrasada" },
    { value: "saida_cedo", label: "Saída cedo" },
    { value: "falta_justificada", label: "Falta justificada" },
    { value: "consulta_medica", label: "Consulta médica" },
    { value: "horas_extras", label: "Horas Extras" },
    { value: "outros", label: "Outros" },
    { value: "falta_nao_justificada", label: "Falta não justificada" },
  ];

  async function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarDados() {
    setCarregando(true);
    try {
      const agora = new Date();
      const mes = agora.getMonth() + 1;
      const ano = agora.getFullYear();

      const [relatorioData, justificativasData] = await Promise.all([
        getRelatorioMensal(mes, ano),
        listarJustificativas(mes, ano),
      ]);

      const diasDiv = relatorioData.dias.filter((dia) => dia.status === "divergente");
      setDiasDivergentes(diasDiv);
      setJustificativas(justificativasData.justificativas || []);
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

  async function handleCriarJustificativa() {
    if (!diaSelecionado || !tipoJustificativa) {
      mostrarAviso("erro", "Selecione um dia e o tipo de justificativa");
      return;
    }

    if (tipoJustificativa !== "falta_nao_justificada" && !descricao.trim()) {
      mostrarAviso("erro", "Descrição é obrigatória");
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        data: diaSelecionado,
        tipo: tipoJustificativa,
        descricao: descricao,
      };

      await criarJustificativa(payload, anexo);
      mostrarAviso("sucesso", "Justificativa criada com sucesso!");
      setTimeout(() => {
        limparAviso();
        setMostrarModal(false);
        setDiaSelecionado(null);
        setTipoJustificativa("");
        setDescricao("");
        setAnexo(null);
        buscarDados();
      }, 1000);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
    }
  }

  function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString("pt-BR");
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

      <div className="overflow-x-hidden overflow-y-auto text-white w-full max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">
            Justificativas
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Dias Divergentes</h2>
            {diasDivergentes.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                Nenhum dia divergente encontrado neste mês
              </p>
            ) : (
              <div className="space-y-2">
                {diasDivergentes.map((dia) => {
                  const temJustificativa = justificativas.some(
                    (j) => j.justificativa_data === dia.data
                  );
                  return (
                    <div
                      key={dia.data}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-semibold">{formatarData(dia.data)}</p>
                        <p className="text-white/70 text-sm">
                          Extras: {dia.horasExtras.toFixed(2)}h | Negativas:{" "}
                          {dia.horasNegativas.toFixed(2)}h
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDiaSelecionado(dia.data);
                          setMostrarModal(true);
                        }}
                        disabled={temJustificativa}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {temJustificativa ? "Já justificado" : "Justificar"}
                      </button>
                    </div>
                  );
                })}
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
                {justificativas.map((j) => {
                  const tipo = tiposJustificativa.find((t) => t.value === j.justificativa_tipo);
                  return (
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
                        Tipo: {tipo ? tipo.label : j.justificativa_tipo}
                      </p>
                      {j.justificativa_descricao && (
                        <p className="text-white/70 text-sm">{j.justificativa_descricao}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-4">Criar Justificativa</h2>

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

              <div>
                <label className="block text-white/70 text-sm mb-2">Tipo de Justificativa</label>
                <select
                  value={tipoJustificativa}
                  onChange={(e) => setTipoJustificativa(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Selecione...</option>
                  {tiposJustificativa.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {tipoJustificativa && tipoJustificativa !== "falta_nao_justificada" && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Descrição</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    placeholder="Descreva o motivo da justificativa..."
                  />
                </div>
              )}

              {tipoJustificativa && tipoJustificativa !== "falta_nao_justificada" && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Anexo (opcional)</label>
                  <input
                    type="file"
                    onChange={(e) => setAnexo(e.target.files[0])}
                    accept="image/*,.pdf"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setDiaSelecionado(null);
                    setTipoJustificativa("");
                    setDescricao("");
                    setAnexo(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarJustificativa}
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
    </div>
  );
}

export default Justificativa;

