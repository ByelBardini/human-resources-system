/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import { Download, FileSpreadsheet, ChartLine, Users, Building2, Check } from "lucide-react";
import { useAviso } from "../../context/AvisoContext.jsx";
import { getEmpresaImagem } from "../../services/api/empresasService.js";
import {
  getEmpresasRelatorios,
  exportarFuncoes,
  getCargosRelatorio,
  getSetoresNiveisRelatorio,
  exportarProjecaoSalarial,
  getCamposFuncionarios,
  exportarFuncionarios,
} from "../../services/api/relatorioService.js";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CAMPOS_DESLIGAMENTO = [
  "funcionario_data_desligamento",
  "funcionario_motivo_inativa",
  "funcionario_gasto_desligamento",
];
const CAMPOS_SALARIO = ["nivel_salario"];

function EmitirRelatorios({ navigate }) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState("");
  const [cargos, setCargos] = useState([]);
  const [selectedCargoIds, setSelectedCargoIds] = useState([]);
  const [campos, setCampos] = useState([]);
  const [selectedCampos, setSelectedCampos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [tipoFiltroFunc, setTipoFiltroFunc] = useState("ativos");
  const [filtros, setFiltros] = useState({
    sexo: "",
    ponto_online: "",
    setor_id: "",
    cargo_id: "",
    nivel_id: "",
    mes_aniversario: "",
  });
  const [abaRelatorio, setAbaRelatorio] = useState("funcoes");
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState({ funcoes: false, projecao: false, funcionarios: false });

  async function carregarEmpresas() {
    setLoading(true);
    try {
      const list = await getEmpresasRelatorios();
      const empresasComImagens = await Promise.all(
        list.map(async (empresa) => {
          try {
            const imagem = await getEmpresaImagem(empresa.empresa_id);
            return { ...empresa, empresa_imagem: imagem };
          } catch {
            return { ...empresa, empresa_imagem: null };
          }
        })
      );
      setEmpresas(empresasComImagens);
      const currentId = localStorage.getItem("empresa_id");
      if (currentId && list.some((e) => String(e.empresa_id) === currentId)) {
        setEmpresaId(currentId);
      } else if (list.length > 0 && !empresaId) {
        setEmpresaId(String(list[0].empresa_id));
      }
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!", true);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err?.message || "Erro ao carregar empresas", true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function carregarCampos() {
    try {
      const list = await getCamposFuncionarios();
      setCampos(list);
      setSelectedCampos(list.map((c) => c.key));
    } catch (err) {
      if (err?.status !== 401 && err?.status !== 403) {
        mostrarAviso("erro", err?.message || "Erro ao carregar campos", true);
      }
    }
  }

  useEffect(() => {
    carregarEmpresas();
    carregarCampos();
  }, []);

  useEffect(() => {
    if (!empresaId) {
      setCargos([]);
      setSetores([]);
      setNiveis([]);
      setSelectedCargoIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cargosList, setoresNiveis] = await Promise.all([
          getCargosRelatorio(empresaId),
          getSetoresNiveisRelatorio(empresaId),
        ]);
        if (!cancelled) {
          setCargos(cargosList);
          setSetores(setoresNiveis.setores || []);
          setNiveis(setoresNiveis.niveis || []);
          setSelectedCargoIds(cargosList.map((c) => c.cargo_id));
        }
      } catch (err) {
        if (!cancelled && err?.status !== 401 && err?.status !== 403) {
          mostrarAviso("erro", err?.message || "Erro ao carregar dados", true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [empresaId]);

  function toggleCargo(id) {
    setSelectedCargoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const camposVisiveis = useMemo(() => {
    if (!campos.length) return [];
    if (tipoFiltroFunc === "todos") return campos;
    if (tipoFiltroFunc === "ativos") {
      return campos.filter((c) => !CAMPOS_DESLIGAMENTO.includes(c.key));
    }
    return campos.filter((c) => !CAMPOS_SALARIO.includes(c.key));
  }, [campos, tipoFiltroFunc]);

  useEffect(() => {
    setSelectedCampos((prev) =>
      prev.filter((key) => camposVisiveis.some((c) => c.key === key))
    );
  }, [tipoFiltroFunc, camposVisiveis]);

  function toggleCampo(key) {
    setSelectedCampos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleExportarFuncoes() {
    if (!empresaId) {
      mostrarAviso("erro", "Selecione uma empresa.", true);
      return;
    }
    setLoadingExport((p) => ({ ...p, funcoes: true }));
    try {
      await exportarFuncoes(empresaId);
      mostrarAviso("sucesso", "Planilha de funções exportada com sucesso!");
      setTimeout(() => limparAviso(), 1500);
    } catch (err) {
      mostrarAviso("erro", err?.message || "Erro ao exportar.", true);
    } finally {
      setLoadingExport((p) => ({ ...p, funcoes: false }));
    }
  }

  async function handleExportarProjecao() {
    if (!empresaId) {
      mostrarAviso("erro", "Selecione uma empresa.", true);
      return;
    }
    setLoadingExport((p) => ({ ...p, projecao: true }));
    try {
      await exportarProjecaoSalarial(empresaId, selectedCargoIds);
      mostrarAviso("sucesso", "Planilha de projeção salarial exportada com sucesso!");
      setTimeout(() => limparAviso(), 1500);
    } catch (err) {
      mostrarAviso("erro", err?.message || "Erro ao exportar.", true);
    } finally {
      setLoadingExport((p) => ({ ...p, projecao: false }));
    }
  }

  async function handleExportarFuncionarios() {
    if (!empresaId) {
      mostrarAviso("erro", "Selecione uma empresa.", true);
      return;
    }
    if (selectedCampos.length === 0) {
      mostrarAviso("erro", "Selecione ao menos um campo.", true);
      return;
    }
    setLoadingExport((p) => ({ ...p, funcionarios: true }));
    try {
      const ativos =
        tipoFiltroFunc === "todos" ? "todos" : tipoFiltroFunc === "ativos" ? true : false;
      const filtrosEnvio = {
        ativos,
        sexo: filtros.sexo || undefined,
        ponto_online: filtros.ponto_online === "sim" ? "sim" : filtros.ponto_online === "nao" ? "nao" : undefined,
        setor_id: filtros.setor_id ? parseInt(filtros.setor_id, 10) : undefined,
        cargo_id: filtros.cargo_id ? parseInt(filtros.cargo_id, 10) : undefined,
        nivel_id: filtros.nivel_id ? parseInt(filtros.nivel_id, 10) : undefined,
        mes_aniversario: filtros.mes_aniversario ? parseInt(filtros.mes_aniversario, 10) : undefined,
      };
      await exportarFuncionarios(empresaId, filtrosEnvio, selectedCampos);
      mostrarAviso("sucesso", "Planilha de funcionários exportada com sucesso!");
      setTimeout(() => limparAviso(), 1500);
    } catch (err) {
      mostrarAviso("erro", err?.message || "Erro ao exportar.", true);
    } finally {
      setLoadingExport((p) => ({ ...p, funcionarios: false }));
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center text-white/70">
        Carregando...
      </div>
    );
  }

  const abas = [
    { id: "funcoes", label: "Funções", icon: FileSpreadsheet },
    { id: "projecao", label: "Projeção Salarial", icon: ChartLine },
    { id: "funcionarios", label: "Funcionários", icon: Users },
  ];

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Seleção de empresa com logos */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col items-center">
        <p className="text-sm font-medium text-white/80 mb-3 text-center">Selecione a empresa</p>
        <div className="flex flex-wrap justify-center gap-4">
          {empresas.map((empresa) => {
            const idStr = String(empresa.empresa_id);
            const selecionada = empresaId === idStr;
            const cor = empresa.empresa_cor || "#64748b";
            return (
              <button
                key={empresa.empresa_id}
                type="button"
                onClick={() => setEmpresaId(idStr)}
                title={empresa.empresa_nome}
                className={`relative flex flex-col items-center gap-2 rounded-2xl p-3 min-w-[88px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  selecionada
                    ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 bg-emerald-500/15 border border-emerald-400/40 shadow-lg shadow-emerald-500/10"
                    : "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                }`}
              >
                {selecionada && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                {empresa.empresa_imagem ? (
                  <img
                    src={empresa.empresa_imagem}
                    alt=""
                    className="w-14 h-14 rounded-xl object-contain border border-white/10 bg-white/5 p-1"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
                    style={{ color: cor }}
                  >
                    <Building2 size={28} />
                  </div>
                )}
                <span className={`text-xs font-medium max-w-[80px] truncate text-center ${selecionada ? "text-emerald-200" : "text-white/80"}`}>
                  {empresa.empresa_nome}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Abas de tipo de relatório */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {abas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAbaRelatorio(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                abaRelatorio === id
                  ? "bg-emerald-500/20 text-emerald-200 border-b-2 border-emerald-400"
                  : "text-white/70 hover:text-white/90 hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 min-h-[400px]">
          {/* Aba Funções */}
          {abaRelatorio === "funcoes" && (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-sm text-white/60 text-center max-w-xl">
                Exporta planilha com todas as funções, campos (escolaridade, treinamento, etc.) e quantidade de funcionários por função.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleExportarFuncoes}
                  disabled={!empresaId || loadingExport.funcoes}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Download size={18} />
                  {loadingExport.funcoes ? "Exportando..." : "Exportar planilha"}
                </button>
              </div>
            </div>
          )}

          {/* Aba Projeção Salarial */}
          {abaRelatorio === "projecao" && (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-sm text-white/60 text-center max-w-xl">
                Exporta planilha com funções e salário por nível. Selecione as funções desejadas.
              </p>
              {empresaId && cargos.length > 0 && (
                <div className="w-full flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto rounded-lg border border-white/10 p-3 bg-white/5">
                  {cargos.map((c) => (
                    <label key={c.cargo_id} className="inline-flex items-center gap-2 cursor-pointer text-sm text-white/90 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCargoIds.includes(c.cargo_id)}
                        onChange={() => toggleCargo(c.cargo_id)}
                        className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                      />
                      {c.cargo_nome}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleExportarProjecao}
                  disabled={!empresaId || loadingExport.projecao}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Download size={18} />
                  {loadingExport.projecao ? "Exportando..." : "Exportar planilha"}
                </button>
              </div>
            </div>
          )}

          {/* Aba Funcionários */}
          {abaRelatorio === "funcionarios" && (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-sm text-white/60 text-center max-w-xl">
                Exporta relatório de funcionários. Escolha todos ou aplique filtros e selecione os campos.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-white/90">
                  <input
                    type="radio"
                    name="tipoFiltroFunc"
                    checked={tipoFiltroFunc === "todos"}
                    onChange={() => setTipoFiltroFunc("todos")}
                    className="text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Todos os funcionários
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-white/90">
                  <input
                    type="radio"
                    name="tipoFiltroFunc"
                    checked={tipoFiltroFunc === "ativos"}
                    onChange={() => setTipoFiltroFunc("ativos")}
                    className="text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Ativos
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-white/90">
                  <input
                    type="radio"
                    name="tipoFiltroFunc"
                    checked={tipoFiltroFunc === "desligados"}
                    onChange={() => setTipoFiltroFunc("desligados")}
                    className="text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Desligados
                </label>
              </div>

              {empresaId && (
                <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border border-white/10 p-3 bg-white/5">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Sexo</label>
                    <select
                      value={filtros.sexo}
                      onChange={(e) => setFiltros((f) => ({ ...f, sexo: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Ponto Online</label>
                    <select
                      value={filtros.ponto_online}
                      onChange={(e) => setFiltros((f) => ({ ...f, ponto_online: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Setor</label>
                    <select
                      value={filtros.setor_id}
                      onChange={(e) => setFiltros((f) => ({ ...f, setor_id: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      {setores.map((s) => (
                        <option key={s.setor_id} value={s.setor_id}>{s.setor_nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Cargo</label>
                    <select
                      value={filtros.cargo_id}
                      onChange={(e) => setFiltros((f) => ({ ...f, cargo_id: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      {cargos.map((c) => (
                        <option key={c.cargo_id} value={c.cargo_id}>{c.cargo_nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Nível</label>
                    <select
                      value={filtros.nivel_id}
                      onChange={(e) => setFiltros((f) => ({ ...f, nivel_id: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      {niveis.map((n) => (
                        <option key={n.nivel_id} value={n.nivel_id}>{n.nivel_nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Mês aniversário</label>
                    <select
                      value={filtros.mes_aniversario}
                      onChange={(e) => setFiltros((f) => ({ ...f, mes_aniversario: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 bg-slate-800 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos</option>
                      {MESES.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="w-full max-w-2xl">
                <label className="block text-sm text-white/80 mb-2">Campos do relatório</label>
                <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto rounded-lg border border-white/10 p-3 bg-white/5">
                  {camposVisiveis.map((c) => (
                    <label key={c.key} className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-white/90">
                      <input
                        type="checkbox"
                        checked={selectedCampos.includes(c.key)}
                        onChange={() => toggleCampo(c.key)}
                        className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleExportarFuncionarios}
                  disabled={!empresaId || loadingExport.funcionarios}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Download size={18} />
                  {loadingExport.funcionarios ? "Exportando..." : "Exportar planilha"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmitirRelatorios;
