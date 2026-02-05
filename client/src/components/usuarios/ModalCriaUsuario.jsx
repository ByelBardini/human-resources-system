import { X, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postUsuario, getFuncionariosSemUsuario } from "../../services/api/usuariosServices";
import { useAviso } from "../../context/AvisoContext.jsx";
import { getCargosUsuarios } from "../../services/api/cargoUsuarioServices";
import { listarPerfisJornadaPublico } from "../../services/api/perfilJornadaService";
import { getEmpresas } from "../../services/api/empresasService";
import CustomSelect from "../default/CustomSelect.jsx";

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
  const [perfilJornadaId, setPerfilJornadaId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [batidaForaEmpresa, setBatidaForaEmpresa] = useState(false);
  const [batidaPonto, setBatidaPonto] = useState(false);
  const [cargos, setCargos] = useState([]);
  const [perfisJornada, setPerfisJornada] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [funcionariosSemUsuario, setFuncionariosSemUsuario] = useState([]);

  async function criaUsuario() {
    if (!nome || !login || !tipoUsuario) {
      mostrarAviso("erro", "Todos os dados são obrigatórios", true);
      return;
    }

    if (tipoUsuario === "usuario" && !cargoId) {
      mostrarAviso("erro", "Selecione um cargo para o usuário", true);
      return;
    }

    if (tipoUsuario === "funcionario" && !perfilJornadaId) {
      mostrarAviso("erro", "Selecione um perfil de carga horária", true);
      return;
    }

    if (tipoUsuario === "funcionario" && !empresaId) {
      mostrarAviso("erro", "Selecione uma empresa", true);
      return;
    }

    if (tipoUsuario === "funcionario" && !funcionarioId) {
      mostrarAviso("erro", "Selecione um funcionário para vincular", true);
      return;
    }

    if (tipoUsuario === "usuario" && batidaPonto) {
      if (!perfilJornadaId) {
        mostrarAviso("erro", "Selecione um perfil de carga horária", true);
        return;
      }
      if (!empresaId) {
        mostrarAviso("erro", "Selecione uma empresa", true);
        return;
      }
      if (!funcionarioId) {
        mostrarAviso("erro", "Selecione um funcionário para vincular", true);
        return;
      }
    }

    setCarregando(true);
    try {
      const usuarioComBatidaPonto =
        tipoUsuario === "funcionario" || (tipoUsuario === "usuario" && batidaPonto);
      await postUsuario({
        usuario_nome: nome,
        usuario_login: login,
        usuario_cargo_id: tipoUsuario === "usuario" ? cargoId : null,
        perfil_jornada_id: usuarioComBatidaPonto ? perfilJornadaId : null,
        empresa_id: usuarioComBatidaPonto ? empresaId : null,
        funcionario_id: usuarioComBatidaPonto ? funcionarioId : null,
        tipo_usuario: tipoUsuario,
        bate_ponto: tipoUsuario === "usuario" ? batidaPonto : undefined,
        batida_fora_empresa: usuarioComBatidaPonto ? batidaForaEmpresa : undefined,
      });

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
        console.error(err.message, err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      console.error(err.message, err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setNome("");
    setLogin("");
    setTipoUsuario("");
    setCargoId("");
    setPerfilJornadaId("");
    setEmpresaId("");
    setFuncionarioId("");
    setBatidaForaEmpresa(false);
    setBatidaPonto(false);
    setFuncionariosSemUsuario([]);
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
    async function buscarDadosFuncionario() {
      const precisaDadosFuncionario =
        tipoUsuario === "funcionario" ||
        (tipoUsuario === "usuario" && batidaPonto);
      if (precisaDadosFuncionario) {
        try {
          const [perfisData, empresasData] = await Promise.all([
            listarPerfisJornadaPublico(),
            getEmpresas()
          ]);
          setPerfisJornada(perfisData.perfis || []);
          setEmpresas(empresasData || []);
        } catch (err) {
          console.error("Erro ao buscar dados:", err);
        }
      } else {
        setPerfisJornada([]);
        setPerfilJornadaId("");
        setEmpresas([]);
        setEmpresaId("");
        setFuncionariosSemUsuario([]);
        setFuncionarioId("");
        setBatidaForaEmpresa(false);
      }
    }
    buscarDadosFuncionario();
  }, [tipoUsuario, batidaPonto]);

  // Buscar funcionários sem usuário quando empresa for selecionada
  useEffect(() => {
    async function buscarFuncionariosSemUsuario() {
      const precisaFuncionarios =
        (tipoUsuario === "funcionario" ||
          (tipoUsuario === "usuario" && batidaPonto)) &&
        empresaId;
      if (precisaFuncionarios) {
        try {
          const funcionariosData = await getFuncionariosSemUsuario(empresaId);
          setFuncionariosSemUsuario(funcionariosData || []);
          setFuncionarioId(""); // Reset funcionário selecionado
        } catch (err) {
          console.error("Erro ao buscar funcionários sem usuário:", err);
          setFuncionariosSemUsuario([]);
        }
      } else {
        setFuncionariosSemUsuario([]);
        setFuncionarioId("");
      }
    }
    buscarFuncionariosSemUsuario();
  }, [empresaId, tipoUsuario, batidaPonto]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setCria(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md max-h-[90vh] rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 text-white shadow-2xl flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
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
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5"
          onKeyDown={(e) => e.key === "Enter" && criaUsuario()}
        >
          <div className="space-y-4">
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
            <CustomSelect
              value={tipoUsuario}
              onChange={(e) => {
                setTipoUsuario(e.target.value);
                if (e.target.value !== "usuario") {
                  setCargoId("");
                }
              }}
            >
              <option hidden value="">
                Selecione...
              </option>
              <option value="usuario">Usuário do Sistema</option>
              <option value="funcionario">Funcionário</option>
            </CustomSelect>
          </div>

          {tipoUsuario === "usuario" && (
            <>
              <div>
                <label className="block text-sm text-white/80 mb-1">
                  Cargo *
                </label>
                <CustomSelect
                  value={cargoId}
                  onChange={(e) => setCargoId(e.target.value)}
                >
                  <option hidden value="">
                    Selecione um cargo...
                  </option>
                  {cargos.map((cargo) => (
                    <option key={cargo.cargo_usuario_id} value={cargo.cargo_usuario_id}>
                      {cargo.cargo_usuario_nome}
                    </option>
                  ))}
                </CustomSelect>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batidaPonto}
                  onChange={(e) => setBatidaPonto(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/30"
                />
                <span className="text-sm text-white/70">Bate ponto</span>
              </label>
              {batidaPonto && (
                <>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">
                      Empresa *
                    </label>
                    {empresas.length === 0 ? (
                      <p className="text-yellow-400 text-sm">
                        Nenhuma empresa disponível.
                      </p>
                    ) : (
                      <CustomSelect
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value)}
                      >
                        <option hidden value="">
                          Selecione uma empresa...
                        </option>
                        {empresas.map((empresa) => (
                          <option key={empresa.empresa_id} value={empresa.empresa_id}>
                            {empresa.empresa_nome}
                          </option>
                        ))}
                      </CustomSelect>
                    )}
                  </div>
                  {empresaId && (
                    <div>
                      <label className="block text-sm text-white/80 mb-1">
                        Funcionário *
                      </label>
                      {funcionariosSemUsuario.length === 0 ? (
                        <p className="text-yellow-400 text-sm">
                          Nenhum funcionário disponível nesta empresa.
                        </p>
                      ) : (
                        <CustomSelect
                          value={funcionarioId}
                          onChange={(e) => {
                            setFuncionarioId(e.target.value);
                            const funcSelecionado = funcionariosSemUsuario.find(
                              (f) => f.funcionario_id === parseInt(e.target.value)
                            );
                            if (funcSelecionado && !nome) {
                              setNome(funcSelecionado.funcionario_nome);
                            }
                          }}
                        >
                          <option hidden value="">
                            Selecione um funcionário...
                          </option>
                          {funcionariosSemUsuario.map((func) => (
                            <option key={func.funcionario_id} value={func.funcionario_id}>
                              {func.funcionario_nome}
                            </option>
                          ))}
                        </CustomSelect>
                      )}
                    </div>
                  )}
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
                      <CustomSelect
                        value={perfilJornadaId}
                        onChange={(e) => setPerfilJornadaId(e.target.value)}
                      >
                        <option hidden value="">
                          Selecione um perfil...
                        </option>
                        {perfisJornada.map((perfil) => (
                          <option key={perfil.perfil_jornada_id} value={perfil.perfil_jornada_id}>
                            {perfil.perfil_jornada_nome}
                          </option>
                        ))}
                      </CustomSelect>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batidaForaEmpresa}
                      onChange={(e) => setBatidaForaEmpresa(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/30"
                    />
                    <span className="text-sm text-white/70">
                      Batidas de ponto fora da empresa
                    </span>
                  </label>
                </>
              )}
            </>
          )}

          {tipoUsuario === "funcionario" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Empresa *
              </label>
              {empresas.length === 0 ? (
                <p className="text-yellow-400 text-sm">
                  Nenhuma empresa disponível.
                </p>
              ) : (
                <CustomSelect
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                >
                  <option hidden value="">
                    Selecione uma empresa...
                  </option>
                  {empresas.map((empresa) => (
                    <option key={empresa.empresa_id} value={empresa.empresa_id}>
                      {empresa.empresa_nome}
                    </option>
                  ))}
                </CustomSelect>
              )}
            </div>
          )}

          {tipoUsuario === "funcionario" && empresaId && (
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Funcionário *
              </label>
              {funcionariosSemUsuario.length === 0 ? (
                <p className="text-yellow-400 text-sm">
                  Nenhum funcionário disponível nesta empresa.
                </p>
              ) : (
                <CustomSelect
                  value={funcionarioId}
                  onChange={(e) => {
                    setFuncionarioId(e.target.value);
                    const funcSelecionado = funcionariosSemUsuario.find(
                      f => f.funcionario_id === parseInt(e.target.value)
                    );
                    if (funcSelecionado && !nome) {
                      setNome(funcSelecionado.funcionario_nome);
                    }
                  }}
                >
                  <option hidden value="">
                    Selecione um funcionário...
                  </option>
                  {funcionariosSemUsuario.map((func) => (
                    <option key={func.funcionario_id} value={func.funcionario_id}>
                      {func.funcionario_nome}
                    </option>
                  ))}
                </CustomSelect>
              )}
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
                <CustomSelect
                  value={perfilJornadaId}
                  onChange={(e) => setPerfilJornadaId(e.target.value)}
                >
                  <option hidden value="">
                    Selecione um perfil...
                  </option>
                  {perfisJornada.map((perfil) => (
                    <option key={perfil.perfil_jornada_id} value={perfil.perfil_jornada_id}>
                      {perfil.perfil_jornada_nome}
                    </option>
                  ))}
                </CustomSelect>
              )}
            </div>
          )}

          {tipoUsuario === "funcionario" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={batidaForaEmpresa}
                onChange={(e) => setBatidaForaEmpresa(e.target.checked)}
                className="w-4 h-4 rounded bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/30"
              />
              <span className="text-sm text-white/70">
                Batidas de ponto fora da empresa
              </span>
            </label>
          )}
          </div>
        </div>

        <div className="p-6 pt-4 flex justify-center flex-shrink-0 border-t border-white/10">
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
