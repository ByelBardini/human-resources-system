/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getRelatorioMensal, getTotaisMensais } from "../services/api/relatorioService.js";
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

  function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function mudarMes(direcao) {
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
  }

  useEffect(() => {
    buscarRelatorio();
    document.title = "Relatório Mensal - Sistema RH";
  }, [mes, ano]);

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

      <div className="overflow-x-hidden overflow-y-auto text-white w-full max-w-6xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-white">Relatório Mensal</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => mudarMes(-1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xl font-semibold">
                {meses[mes - 1]} {ano}
              </span>
              <button
                onClick={() => mudarMes(1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {totais && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">Total Trabalhadas</p>
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
                <p className="text-white/70 text-sm mb-1">Banco de Horas</p>
                <p
                  className={`text-2xl font-semibold ${
                    totais.bancoHoras >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {totais.bancoHoras >= 0 ? "+" : ""}
                  {totais.bancoHoras.toFixed(2)}h
                </p>
              </div>
            </div>
          )}

          {totais && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">Dias Divergentes</p>
                <p className="text-2xl font-semibold text-yellow-400">
                  {totais.diasDivergentes}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">Justificativas Pendentes</p>
                <p className="text-2xl font-semibold text-yellow-400">
                  {totais.justificativasPendentes}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">Justificativas Aprovadas</p>
                <p className="text-2xl font-semibold text-green-400">
                  {totais.justificativasAprovadas}
                </p>
              </div>
            </div>
          )}

          {relatorio && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">Data</th>
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">
                      Trabalhadas
                    </th>
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">Extras</th>
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">Negativas</th>
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-white/70 font-semibold">
                      Justificativas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.dias.map((dia) => (
                    <tr
                      key={dia.data}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-white">{formatarData(dia.data)}</td>
                      <td className="py-3 px-4 text-white">{dia.horasTrabalhadas.toFixed(2)}h</td>
                      <td className="py-3 px-4 text-green-400">
                        {dia.horasExtras.toFixed(2)}h
                      </td>
                      <td className="py-3 px-4 text-red-400">
                        {dia.horasNegativas.toFixed(2)}h
                      </td>
                      <td className="py-3 px-4">
                        {dia.status === "normal" ? (
                          <span className="text-green-400">Normal</span>
                        ) : (
                          <span className="text-yellow-400">Divergente</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {dia.justificativas.length > 0 ? (
                          <span className="text-blue-400">
                            {dia.justificativas.length} justificativa(s)
                          </span>
                        ) : (
                          <span className="text-white/50">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RelatorioMensal;

