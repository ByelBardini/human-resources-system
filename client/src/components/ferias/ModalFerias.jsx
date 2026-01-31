import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  criarFerias,
  atualizarFerias,
  cancelarFerias,
  getUsuariosFerias,
} from "../../services/api/feriasService.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalFerias({
  ferias,
  modoEdicao,
  setModalAberto,
  setCarregando,
  setAtualizado,
  navigate,
}) {
  const { mostrarAviso, limparAviso } = useAviso();

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    async function buscarUsuarios() {
      try {
        const usuariosData = await getUsuariosFerias();
        setUsuarios(usuariosData || []);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      }
    }
    buscarUsuarios();
  }, []);

  useEffect(() => {
    if (modoEdicao && ferias) {
      setUsuarioSelecionado(
        ferias.ferias_usuario_id?.toString() ||
          ferias.usuario?.usuario_id?.toString() ||
          ""
      );
      setDataInicio(ferias.ferias_data_inicio || "");
      setDataFim(ferias.ferias_data_fim || "");
    } else {
      setUsuarioSelecionado("");
      setDataInicio("");
      setDataFim("");
    }
  }, [modoEdicao, ferias]);

  function validarPeriodo() {
    if (!dataInicio || !dataFim) {
      mostrarAviso("erro", "Data de início e fim são obrigatórias", true);
      return false;
    }
    if (dataInicio > dataFim) {
      mostrarAviso("erro", "Data de início não pode ser maior que a data fim", true);
      return false;
    }
    return true;
  }

  async function salvarFerias() {
    if (!usuarioSelecionado) {
      mostrarAviso("erro", "Selecione um usuário", true);
      return;
    }
    if (!validarPeriodo()) return;

    setCarregando(true);
    try {
      const payload = {
        usuario_id: parseInt(usuarioSelecionado),
        data_inicio: dataInicio,
        data_fim: dataFim,
      };

      if (modoEdicao && ferias) {
        await atualizarFerias(ferias.ferias_id, {
          data_inicio: dataInicio,
          data_fim: dataFim,
        });
        mostrarAviso("sucesso", "Férias atualizadas com sucesso!", true);
      } else {
        await criarFerias(payload);
        mostrarAviso("sucesso", "Férias cadastradas com sucesso!", true);
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
        mostrarAviso("erro", err.message || "Erro ao salvar férias", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function cancelarPeriodo() {
    if (!ferias) return;
    if (!window.confirm("Tem certeza que deseja cancelar este período de férias?")) {
      return;
    }
    setCarregando(true);
    try {
      await cancelarFerias(ferias.ferias_id);
      mostrarAviso("sucesso", "Férias canceladas com sucesso!", true);
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
        mostrarAviso("erro", err.message || "Erro ao cancelar férias", true);
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
            {modoEdicao ? "Editar Férias" : "Novo Período de Férias"}
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
              Usuário
            </label>
            <select
              value={usuarioSelecionado}
              onChange={(e) => setUsuarioSelecionado(e.target.value)}
              disabled={modoEdicao}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                colorScheme: "dark",
              }}
            >
              <option value="" style={{ backgroundColor: "#1e293b", color: "#ffffff" }}>
                Selecione um usuário
              </option>
              {usuarios.map((usuario) => (
                <option
                  key={usuario.usuario_id}
                  value={usuario.usuario_id}
                  style={{ backgroundColor: "#1e293b", color: "#ffffff" }}
                >
                  {usuario.usuario_nome}
                  {usuario.empresa?.empresa_nome
                    ? ` - ${usuario.empresa.empresa_nome}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Data início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Data fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {modoEdicao && (
            <button
              onClick={cancelarPeriodo}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 transition"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={salvarFerias}
            className="flex-1 px-4 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
          >
            {modoEdicao ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalFerias;
