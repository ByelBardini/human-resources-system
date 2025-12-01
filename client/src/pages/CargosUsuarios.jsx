/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCargosUsuarios, deleteCargoUsuario } from "../services/api/cargoUsuarioServices.js";
import { getPermissoesAgrupadas } from "../services/api/permissaoServices.js";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import ModalCargoUsuario from "../components/cargosUsuarios/ModalCargoUsuario.jsx";

function CargosUsuarios() {
  const navigate = useNavigate();

  const [cargos, setCargos] = useState([]);
  const [categoriasPermissoes, setCategoriasPermissoes] = useState([]);
  const [cargoSelecionado, setCargoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [atualizado, setAtualizado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();

  async function buscaCargos() {
    setCarregando(true);
    try {
      const cargosData = await getCargosUsuarios();
      setCargos(cargosData);
      setAtualizado(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", "Erro ao buscar cargos:", true);
        console.error(err);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function buscaPermissoes() {
    try {
      const categoriasData = await getPermissoesAgrupadas();
      setCategoriasPermissoes(categoriasData);
    } catch (err) {
      console.error("Erro ao buscar permissões:", err);
    }
  }

  async function deletarCargo(id, nome) {
    if (!window.confirm(`Tem certeza que deseja inativar o cargo "${nome}"?`)) {
      return;
    }

    setCarregando(true);
    try {
      await deleteCargoUsuario(id);
      mostrarAviso("sucesso", "Cargo inativado com sucesso!", true);
      setAtualizado(true);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message || "Erro ao inativar cargo", true);
      }
    } finally {
      setCarregando(false);
    }
  }

  function abrirModalCriar() {
    setCargoSelecionado(null);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirModalEditar(cargo) {
    setCargoSelecionado(cargo);
    setModoEdicao(true);
    setModalAberto(true);
  }

  useEffect(() => {
    buscaCargos();
    buscaPermissoes();
    document.title = "Cargos de Usuários - Sistema RH";
  }, [atualizado]);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {modalAberto && (
        <ModalCargoUsuario
          cargo={cargoSelecionado}
          categoriasPermissoes={categoriasPermissoes}
          modoEdicao={modoEdicao}
          setModalAberto={setModalAberto}
          setCarregando={setCarregando}
          setAtualizado={setAtualizado}
          navigate={navigate}
        />
      )}

      {carregando && <Loading />}

      <button
        className="cursor-pointer absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/usuario", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="text-white flex flex-col gap-5 items-center justify-center w-full max-w-4xl">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-white">
              Gerenciar Cargos de Usuários
            </h1>
            <button
              onClick={abrirModalCriar}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
            >
              <Plus size={18} />
              Novo Cargo
            </button>
          </div>

          <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {cargos.map((cargo) => (
              <div
                key={cargo.cargo_usuario_id}
                className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-base font-semibold text-white">
                        {cargo.cargo_usuario_nome}
                      </h2>
                      <span
                        className={`px-2 py-[2px] text-xs font-medium rounded-full ${
                          cargo.cargo_usuario_ativo === 1
                            ? "bg-green-500/20 border border-green-400/30 text-green-300"
                            : "bg-red-500/20 border border-red-400/30 text-red-300"
                        }`}
                      >
                        {cargo.cargo_usuario_ativo === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    {cargo.cargo_usuario_descricao && (
                      <p className="text-sm text-white/70 mb-3">
                        {cargo.cargo_usuario_descricao}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {cargo.permissoes && cargo.permissoes.length > 0 ? (
                        cargo.permissoes.map((permissao) => (
                          <span
                            key={permissao.permissao_id}
                            className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300"
                          >
                            {permissao.permissao_nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/50">
                          Nenhuma permissão atribuída
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => abrirModalEditar(cargo)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    {cargo.cargo_usuario_ativo === 1 && (
                      <button
                        onClick={() =>
                          deletarCargo(
                            cargo.cargo_usuario_id,
                            cargo.cargo_usuario_nome
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 px-3 py-1.5 text-sm transition"
                      >
                        <Trash2 size={16} />
                        Inativar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {cargos.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum cargo encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CargosUsuarios;

