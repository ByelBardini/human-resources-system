import { X, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postUsuario, getFuncionariosSemUsuario } from "../../services/api/usuariosServices";
import { useAviso } from "../../context/AvisoContext";
import { getCargosUsuarios } from "../../services/api/cargoUsuarioServices";
import { listarPerfisJornadaPublico } from "../../services/api/perfilJornadaService";

function ModalCriaUsuario({
  setCria,
  setCarregando,
  setCadastrado,
  cadastrado,
  navigate: navigateProp,
}) {
  const navigateHook = useNavigate();
  const navigate = navigateProp || navigateHook;
  const { mostrarAviso, limparAviso } = useAviso();

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState(""); // "funcionario" ou "usuario"
  const [cargoId, setCargoId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [perfilJornadaId, setPerfilJornadaId] = useState("");
  const [cargos, setCargos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [perfisJornada, setPerfisJornada] = useState([]);
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);

  async function criaUsuario() {
    if (!nome || !login || !tipoUsuario) {
      mostrarAviso("erro", "Todos os dados são obrigatórios", true);
      return;
    }

    if (tipoUsuario === "usuario" && !cargoId) {
      mostrarAviso("erro", "Selecione um cargo para o usuário", true);
      return;
    }

    if (tipoUsuario === "funcionario" && !funcionarioId) {
      mostrarAviso("erro", "Selecione um funcionário", true);
      return;
    }

    if (tipoUsuario === "funcionario" && !perfilJornadaId) {
      mostrarAviso("erro", "Selecione um perfil de carga horária", true);
      return;
    }

    setCarregando(true);
    try {
      await postUsuario(
        nome,
        login,
        tipoUsuario === "funcionario" ? null : cargoId,
        tipoUsuario === "funcionario" ? funcionarioId : null,
        tipoUsuario === "funcionario" ? perfilJornadaId : null
      );

      mostrarAviso(
        "sucesso",
        "Usuário cadastrado com sucesso!\nSenha padrão: 12345",
        true
      );

      setCadastrado(true);
      setCria(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        console.erro(err.message, err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      limparAviso();
      console.error(err.message, err, true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setNome("");
    setLogin("");
    setTipoUsuario("");
    setCargoId("");
    setFuncionarioId("");
    setPerfilJornadaId("");
  }, [cadastrado]);

  useEffect(() => {
    async function buscarCargos() {
      try {
        const cargosData = await getCargosUsuarios();
        setCargos(cargosData.filter(c => c.cargo_usuario_ativo === 1));
      } catch (err) {
        console.error("Erro ao buscar cargos:", err);
      }
    }
    buscarCargos();
  }, []);

  useEffect(() => {
    async function buscarFuncionarios() {
      if (tipoUsuario === "funcionario") {
        setCarregandoFuncionarios(true);
        try {
          const empresa_id = localStorage.getItem("empresa_id");
          if (empresa_id) {
            const funcionariosData = await getFuncionariosSemUsuario(empresa_id);
            setFuncionarios(funcionariosData);
          }
        } catch (err) {
          console.error("Erro ao buscar funcionários:", err);
        } finally {
          setCarregandoFuncionarios(false);
        }
      } else {
        setFuncionarios([]);
        setFuncionarioId("");
        setPerfilJornadaId("");
      }
    }
    buscarFuncionarios();
  }, [tipoUsuario]);

  useEffect(() => {
    async function buscarPerfisJornada() {
      if (tipoUsuario === "funcionario") {
        try {
          const perfisData = await listarPerfisJornadaPublico();
          setPerfisJornada(perfisData.perfis || []);
        } catch (err) {
          console.error("Erro ao buscar perfis de jornada:", err);
        }
      } else {
        setPerfisJornada([]);
      }
    }
    buscarPerfisJornada();
  }, [tipoUsuario]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setCria(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cadastrar usuário</h2>
          <button
            className="rounded-lg p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Fechar"
            onClick={() => setCria(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="space-y-4"
          onKeyDown={(e) => e.key === "Enter" && criaUsuario()}
        >
          <div>
            <label className="block text-sm text-white/80 mb-1">
              Nome completo
            </label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: Maria da Silva"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: maria.silva"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">
              Tipo de Perfil *
            </label>
            <select
              value={tipoUsuario}
              onChange={(e) => {
                setTipoUsuario(e.target.value);
                if (e.target.value !== "usuario") {
                  setCargoId("");
                }
              }}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            >
              <option hidden value="">
                Selecione...
              </option>
              <option className="bg-slate-900" value="usuario">
                Usuário do Sistema
              </option>
              <option className="bg-slate-900" value="funcionario">
                Funcionário
              </option>
            </select>
          </div>

          {tipoUsuario === "usuario" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Cargo *
              </label>
              <select
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              >
                <option hidden value="">
                  Selecione um cargo...
                </option>
                {cargos.map((cargo) => (
                  <option
                    key={cargo.cargo_usuario_id}
                    className="bg-slate-900"
                    value={cargo.cargo_usuario_id}
                  >
                    {cargo.cargo_usuario_nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoUsuario === "funcionario" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Perfil de Carga Horária *
              </label>
              {perfisJornada.length === 0 ? (
                <div>
                  <p className="text-yellow-400 text-sm mb-2">
                    Nenhum perfil disponível.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCria(false);
                      navigate("/perfis-jornada");
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Criar perfil de jornada
                  </button>
                </div>
              ) : (
                <select
                  value={perfilJornadaId}
                  onChange={(e) => setPerfilJornadaId(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                >
                  <option hidden value="">
                    Selecione um perfil...
                  </option>
                  {perfisJornada.map((perfil) => (
                    <option
                      key={perfil.perfil_jornada_id}
                      className="bg-slate-900"
                      value={perfil.perfil_jornada_id}
                    >
                      {perfil.perfil_jornada_nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {tipoUsuario === "funcionario" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Funcionário *
              </label>
              {carregandoFuncionarios ? (
                <p className="text-white/70 text-sm">Carregando funcionários...</p>
              ) : funcionarios.length === 0 ? (
                <p className="text-yellow-400 text-sm">
                  Nenhum funcionário disponível sem usuário vinculado
                </p>
              ) : (
                <select
                  value={funcionarioId}
                  onChange={(e) => setFuncionarioId(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                >
                  <option hidden value="">
                    Selecione um funcionário...
                  </option>
                  {funcionarios.map((funcionario) => (
                    <option
                      key={funcionario.funcionario_id}
                      className="bg-slate-900"
                      value={funcionario.funcionario_id}
                    >
                      {funcionario.funcionario_nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={criaUsuario}
            className="inline-flex items-center gap-2 rounded-lg border bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25 px-3 py-1.5 text-sm transition"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCriaUsuario;
