import { memo, useEffect, useState } from "react";
import { X } from "lucide-react";
import { criarFeriado, atualizarFeriado, excluirFeriado } from "../../services/api/feriadoService.js";
import { getEmpresas } from "../../services/api/empresasService.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalFeriado({
  feriado,
  modoEdicao,
  setModalAberto,
  setCarregando,
  setAtualizado,
  navigate,
}) {
  const { mostrarAviso, limparAviso } = useAviso();

  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [repetirAno, setRepetirAno] = useState(false);

  useEffect(() => {
    async function buscarEmpresas() {
      try {
        const empresasData = await getEmpresas();
        setEmpresas(empresasData || []);
      } catch (err) {
        console.error("Erro ao buscar empresas:", err);
      }
    }
    buscarEmpresas();
  }, []);

  useEffect(() => {
    if (modoEdicao && feriado) {
      setNome(feriado.feriado_nome || "");
      setData(feriado.feriado_data || "");
      // Se tiver array de empresas, usar ele; senão, usar empresa_id único (compatibilidade)
      const empresasIds = feriado.empresas 
        ? feriado.empresas.map(e => e.empresa_id.toString())
        : (feriado.feriado_empresa_id ? [feriado.feriado_empresa_id.toString()] : []);
      setEmpresasSelecionadas(empresasIds);
      setRepetirAno(feriado.feriado_repetir_ano === 1 || feriado.feriado_repetir_ano === true);
    } else {
      setNome("");
      setData("");
      setEmpresasSelecionadas([]);
      setRepetirAno(false);
    }
  }, [modoEdicao, feriado]);

  function toggleEmpresa(empresaId) {
    setEmpresasSelecionadas((prev) => {
      const idStr = empresaId.toString();
      if (prev.includes(idStr)) {
        return prev.filter((id) => id !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  }

  async function salvarFeriado() {
    if (!nome || !data || empresasSelecionadas.length === 0) {
      mostrarAviso("erro", "Nome, data e pelo menos uma empresa são obrigatórios", true);
      return;
    }

    setCarregando(true);
    try {
      const dadosFeriado = {
        feriado_nome: nome,
        feriado_data: data,
        feriado_empresas_ids: empresasSelecionadas.map((id) => parseInt(id)),
        feriado_repetir_ano: repetirAno,
      };

      if (modoEdicao) {
        await atualizarFeriado(feriado.feriado_id, dadosFeriado);
        mostrarAviso("sucesso", "Feriado atualizado com sucesso!", true);
      } else {
        await criarFeriado(dadosFeriado);
        mostrarAviso("sucesso", "Feriado cadastrado com sucesso!", true);
      }

      setAtualizado(true);
      setModalAberto(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message || "Erro ao salvar feriado", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function deletarFeriado() {
    if (!window.confirm(`Tem certeza que deseja excluir o feriado "${nome}"?`)) {
      return;
    }

    setCarregando(true);
    try {
      await excluirFeriado(feriado.feriado_id);
      mostrarAviso("sucesso", "Feriado excluído com sucesso!", true);
      setAtualizado(true);
      setModalAberto(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message || "Erro ao excluir feriado", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setModalAberto(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {modoEdicao ? "Editar Feriado" : "Novo Feriado"}
          </h2>
          <button
            onClick={() => setModalAberto(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nome do Feriado
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dia da Independência"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Empresas
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
              {empresas.length === 0 ? (
                <p className="text-white/60 text-sm">Carregando empresas...</p>
              ) : (
                empresas.map((empresa) => (
                  <label
                    key={empresa.empresa_id}
                    className="flex items-center gap-2 hover:bg-white/5 rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={empresasSelecionadas.includes(empresa.empresa_id.toString())}
                      onChange={() => toggleEmpresa(empresa.empresa_id)}
                      disabled={modoEdicao}
                      className="rounded bg-white/5 border-white/15 w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-white/80">{empresa.empresa_nome}</span>
                  </label>
                ))
              )}
            </div>
            {!modoEdicao && empresasSelecionadas.length === 0 && (
              <p className="text-xs text-yellow-400/80 mt-1">Selecione pelo menos uma empresa</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={repetirAno}
                onChange={(e) => setRepetirAno(e.target.checked)}
                className="rounded bg-white/5 border-white/15 w-4 h-4"
              />
              <span className="text-sm text-white/80">Repetir todo ano</span>
            </label>
            <p className="text-xs text-white/60 ml-6 mt-1">
              O feriado será criado para o mesmo dia/mês nos próximos anos
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {modoEdicao && (
            <button
              onClick={deletarFeriado}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 transition"
            >
              Excluir
            </button>
          )}
          <button
            onClick={salvarFeriado}
            className="flex-1 px-4 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
          >
            {modoEdicao ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ModalFeriado);
