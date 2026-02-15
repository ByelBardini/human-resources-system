import { memo, useEffect, useState } from "react";
import { X, CalendarPlus, Type, Building2, Calendar, Repeat, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";
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
      if (err.status === 401 || err.status === 403) {
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
      if (err.status === 401 || err.status === 403) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setModalAberto(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <CalendarPlus size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold">
                {modoEdicao ? "Editar Feriado" : "Novo Feriado"}
              </h2>
              <p className="text-xs text-white/50">
                {modoEdicao ? "Altere os dados do feriado" : "Cadastre um novo feriado"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAberto(false)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
              <Type size={14} className="text-white/50" />
              Nome do Feriado
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dia da Independência"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                         outline-none focus:bg-white/15 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          {/* Empresas */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
              <Building2 size={14} className="text-white/50" />
              Empresas
            </label>
            <div className="max-h-48 overflow-y-auto rounded-xl bg-white/5 border border-white/10 p-2 space-y-1 custom-scrollbar">
              {empresas.length === 0 ? (
                <p className="text-white/50 text-sm py-3 text-center">Carregando empresas...</p>
              ) : (
                empresas.map((empresa) => {
                  const isChecked = empresasSelecionadas.includes(empresa.empresa_id.toString());
                  return (
                    <label
                      key={empresa.empresa_id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors
                        ${isChecked ? 'bg-emerald-500/10' : 'hover:bg-white/5'}
                        ${modoEdicao ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                        ${isChecked 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'bg-white/5 border-white/20'}`}
                      >
                        {isChecked && <Check size={14} className="text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmpresa(empresa.empresa_id)}
                        disabled={modoEdicao}
                        className="sr-only"
                      />
                      <span className="text-sm text-white/80">{empresa.empresa_nome}</span>
                    </label>
                  );
                })
              )}
            </div>
            {!modoEdicao && empresasSelecionadas.length === 0 && (
              <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
                Selecione pelo menos uma empresa
              </p>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
              <Calendar size={14} className="text-white/50" />
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90 
                         outline-none focus:bg-white/15 focus:ring-1 focus:ring-blue-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          {/* Repetir todo ano - Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Repeat size={18} className="text-white/50" />
              <div>
                <span className="text-sm text-white/90 font-medium">Repetir todo ano</span>
                <p className="text-xs text-white/50 mt-0.5">
                  Mesmo dia/mês nos próximos anos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRepetirAno(!repetirAno)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${repetirAno ? 'bg-emerald-500' : 'bg-white/20'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${repetirAno ? 'translate-x-6' : 'translate-x-1'}`} 
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex gap-3">
          {modoEdicao && (
            <button
              onClick={deletarFeriado}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setModalAberto(false)}
            className="px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvarFeriado}
            className="px-5 py-2.5 rounded-lg text-sm text-white bg-white/25 hover:bg-white/35 border border-white/20 transition-colors"
          >
            {modoEdicao ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(ModalFeriado);
