import { memo, useEffect, useState } from "react";
import { X, Save, Building2, ChevronDown, ChevronUp } from "lucide-react";
import {
  postCargoUsuario,
  putCargoUsuario,
} from "../../services/api/cargoUsuarioServices.js";
import { getEmpresas } from "../../services/api/empresasService.js";
import { useAviso } from "../../context/AvisoContext.jsx";
import { useAuthError } from "../../hooks/useAuthError.js";
import logger from "../../utils/logger.js";

// Permissões que suportam filtro por empresa
const PERMISSOES_COM_EMPRESA = [
  "sistema.visualizar_funcionarios",
  "sistema.gerenciar_cargos",
];

function ModalCargoUsuario({
  cargo,
  categoriasPermissoes,
  modoEdicao,
  setModalAberto,
  setCarregando,
  setAtualizado,
  navigate,
}) {
  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState([]);
  const [ativo, setAtivo] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [permissoesEmpresas, setPermissoesEmpresas] = useState({});
  const [permissaoExpandida, setPermissaoExpandida] = useState(null);

  useEffect(() => {
    async function carregarEmpresas() {
      try {
        const data = await getEmpresas();
        setEmpresas(data || []);
      } catch (err) {
        logger.error("Erro ao carregar empresas:", err);
      }
    }
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (modoEdicao && cargo) {
      setNome(cargo.cargo_usuario_nome || "");
      setDescricao(cargo.cargo_usuario_descricao || "");
      setAtivo(cargo.cargo_usuario_ativo === 1);
      setPermissoesSelecionadas(
        cargo.permissoes
          ? cargo.permissoes.map((p) => p.permissao_id)
          : []
      );
      // Carregar empresas por permissão se existirem
      if (cargo.permissoesEmpresas) {
        const pe = {};
        for (const [permId, empresasList] of Object.entries(cargo.permissoesEmpresas)) {
          pe[permId] = empresasList.map(e => e.empresa_id);
        }
        setPermissoesEmpresas(pe);
      } else {
        setPermissoesEmpresas({});
      }
    } else {
      setNome("");
      setDescricao("");
      setPermissoesSelecionadas([]);
      setAtivo(true);
      setPermissoesEmpresas({});
    }
  }, [modoEdicao, cargo]);

  function togglePermissao(permissaoId) {
    setPermissoesSelecionadas((prev) => {
      if (prev.includes(permissaoId)) {
        // Ao desmarcar, remover também as empresas configuradas
        setPermissoesEmpresas((prevPE) => {
          const newPE = { ...prevPE };
          delete newPE[permissaoId];
          return newPE;
        });
        return prev.filter((id) => id !== permissaoId);
      } else {
        return [...prev, permissaoId];
      }
    });
  }

  function toggleEmpresaPermissao(permissaoId, empresaId) {
    setPermissoesEmpresas((prev) => {
      const empresasAtuais = prev[permissaoId] || [];
      if (empresasAtuais.includes(empresaId)) {
        return {
          ...prev,
          [permissaoId]: empresasAtuais.filter((id) => id !== empresaId),
        };
      } else {
        return {
          ...prev,
          [permissaoId]: [...empresasAtuais, empresaId],
        };
      }
    });
  }

  function getPermissaoCodigo(permissaoId) {
    for (const cat of categoriasPermissoes || []) {
      for (const perm of cat.permissoes || []) {
        if (perm.permissao_id === permissaoId) {
          return perm.permissao_codigo;
        }
      }
    }
    return null;
  }

  function permissaoSuportaEmpresa(permissaoId) {
    const codigo = getPermissaoCodigo(permissaoId);
    return PERMISSOES_COM_EMPRESA.includes(codigo);
  }

  async function salvarCargo() {
    if (!nome.trim()) {
      mostrarAviso("erro", "Nome do cargo é obrigatório", true);
      return;
    }

    setCarregando(true);
    try {
      const dados = {
        cargo_usuario_nome: nome.trim(),
        cargo_usuario_descricao: descricao.trim() || null,
        cargo_usuario_ativo: ativo ? 1 : 0,
        permissoes: permissoesSelecionadas,
        permissoesEmpresas: permissoesEmpresas,
      };

      if (modoEdicao) {
        await putCargoUsuario(cargo.cargo_usuario_id, dados);
        mostrarAviso("sucesso", "Cargo atualizado com sucesso!", true);
      } else {
        await postCargoUsuario(dados);
        mostrarAviso("sucesso", "Cargo criado com sucesso!", true);
      }

      setAtualizado(true);
      setModalAberto(false);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError(setCarregando);
      } else {
        mostrarAviso("erro", err.message || "Erro ao salvar cargo", true);
      }
      logger.error(err.message, err);
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
        className="relative w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho fixo */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-white/10">
          <h2 className="text-lg font-semibold">
            {modoEdicao ? "Editar Cargo" : "Novo Cargo"}
          </h2>
          <button
            className="rounded-lg p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Fechar"
            onClick={() => setModalAberto(false)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo fixo (campos) */}
        <div className="flex-shrink-0 p-4 pt-3 space-y-3 border-b border-white/10">
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Nome do Cargo *
            </label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full text-sm rounded-lg bg-white/5 border border-white/15 px-2 py-1.5 outline-none focus:border-white/30"
              placeholder="Ex.: Gerente de RH"
            />
          </div>

          <div>
            <label className="block text-xs text-white/80 mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full text-sm rounded-lg bg-white/5 border border-white/15 px-2 py-1.5 outline-none focus:border-white/30 resize-none"
              rows="2"
              placeholder="Descrição do cargo..."
            />
          </div>

          {modoEdicao && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded bg-white/5 border-white/15"
                />
                <span className="text-xs text-white/80">Cargo Ativo</span>
              </label>
            </div>
          )}
        </div>

        {/* Área de permissões com scroll */}
        <div className="flex-1 min-h-0 flex flex-col p-4">
          <label className="block text-xs text-white/80 mb-2">
            Permissões
          </label>
          <div className="flex-1 overflow-y-auto rounded-lg bg-white/5 border border-white/15 p-3 space-y-3">
            {categoriasPermissoes && categoriasPermissoes.length > 0 ? (
              categoriasPermissoes.map((categoria) => (
                <div key={categoria.categoria_id} className="space-y-2">
                  <div className="py-1.5 border-b border-white/20">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                      {categoria.categoria_nome}
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {categoria.permissoes && categoria.permissoes.length > 0 ? (
                      categoria.permissoes.map((permissao) => {
                        const selecionada = permissoesSelecionadas.includes(permissao.permissao_id);
                        const suportaEmpresa = permissaoSuportaEmpresa(permissao.permissao_id);
                        const expandida = permissaoExpandida === permissao.permissao_id;
                        const empresasSelecionadas = permissoesEmpresas[permissao.permissao_id] || [];

                        return (
                          <div key={permissao.permissao_id} className="rounded bg-white/5">
                            <label
                              className="flex items-start gap-2 p-1.5 hover:bg-white/5 transition"
                            >
                              <input
                                type="checkbox"
                                checked={selecionada}
                                onChange={() => togglePermissao(permissao.permissao_id)}
                                className="mt-0.5 rounded bg-white/5 border-white/15"
                              />
                              <div className="flex-1">
                                <div className="text-xs font-medium text-white flex items-center gap-1">
                                  {permissao.permissao_nome}
                                  {suportaEmpresa && selecionada && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setPermissaoExpandida(expandida ? null : permissao.permissao_id);
                                      }}
                                      className="p-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                      title="Configurar empresas"
                                    >
                                      <Building2 size={12} />
                                    </button>
                                  )}
                                </div>
                                {permissao.permissao_descricao && (
                                  <div className="text-[10px] text-white/60 mt-0.5">
                                    {permissao.permissao_descricao}
                                  </div>
                                )}
                                {suportaEmpresa && selecionada && empresasSelecionadas.length > 0 && (
                                  <div className="text-[10px] text-blue-300 mt-0.5">
                                    Restrito a {empresasSelecionadas.length} empresa(s)
                                  </div>
                                )}
                              </div>
                              {suportaEmpresa && selecionada && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPermissaoExpandida(expandida ? null : permissao.permissao_id);
                                  }}
                                  className="p-1"
                                >
                                  {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              )}
                            </label>
                            
                            {/* Seleção de empresas */}
                            {suportaEmpresa && selecionada && expandida && (
                              <div className="border-t border-white/10 p-2 bg-white/5">
                                <p className="text-[10px] text-white/60 mb-1.5">
                                  Selecione as empresas permitidas (vazio = todas):
                                </p>
                                <div className="grid grid-cols-2 gap-1">
                                  {empresas.map((empresa) => (
                                    <label
                                      key={empresa.empresa_id}
                                      className="flex items-center gap-1.5 p-1 rounded hover:bg-white/10"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={empresasSelecionadas.includes(empresa.empresa_id)}
                                        onChange={() => toggleEmpresaPermissao(permissao.permissao_id, empresa.empresa_id)}
                                        className="rounded bg-white/5 border-white/15"
                                      />
                                      <span className="text-[10px] text-white truncate">
                                        {empresa.empresa_nome}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[10px] text-white/50 pl-2 py-1">
                        Nenhuma permissão nesta categoria
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-white/60 text-center py-4">
                Nenhuma permissão disponível
              </div>
            )}
          </div>
        </div>

        {/* Botões fixos */}
        <div className="flex-shrink-0 p-4 pt-3 border-t border-white/10 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setModalAberto(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white/10 border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvarCargo}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25 px-3 py-1.5 text-xs transition"
          >
            <Save size={14} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ModalCargoUsuario);

