/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, Settings, Clock, Monitor, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUsuario, getUsuariosFuncionarios } from "../services/api/usuariosServices.js";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background";
import CampoUsuario from "../components/usuarios/CampoUsuario.jsx";
import ModalUsuario from "../components/usuarios/ModalVisualizaUsuario.jsx";
import ModalCriaUsuario from "../components/usuarios/ModalCriaUsuario.jsx";
import { useAuthError } from "../hooks/useAuthError.js";

function Usuario() {
  const navigate = useNavigate();

  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [usuariosFuncionarios, setUsuariosFuncionarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState();

  const [visualiza, setVisualiza] = useState(false);
  const [cria, setCria] = useState(false);
  const [atualizado, setAtualizado] = useState(false);

  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();

  const botoesAcao = [
    { to: "/perfis-jornada", icon: Clock, title: "Gerenciar Perfis de Jornada" },
    { to: "/cargos-usuarios", icon: Settings, title: "Gerenciar Cargos" },
  ];

  async function buscaUsuarios() {
    setCarregando(true);
    try {
      const [usuarios, funcionarios] = await Promise.all([
        getUsuario(),
        getUsuariosFuncionarios(),
      ]);
      setUsuariosSistema(usuarios);
      setUsuariosFuncionarios(funcionarios);
      setAtualizado(false);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError(setCarregando);
      } else {
        mostrarAviso("erro", "Erro ao buscar usuários:", true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscaUsuarios();
    document.title = "Usuários - Atlas";
  }, [atualizado]);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {cria && (
        <ModalCriaUsuario
          setCria={setCria}
          setCarregando={setCarregando}
          setCadastrado={setAtualizado}
          cadastrado={atualizado}
          navigate={navigate}
        />
      )}
      {visualiza && (
        <ModalUsuario
          setVisualiza={setVisualiza}
          usuarioSelecionado={usuarioSelecionado}
          setCarregando={setCarregando}
          modificou={setAtualizado}
          navigate={navigate}
        />
      )}

      {carregando && <Loading />}

      <button
        className="absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/home", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="absolute top-6 right-6 flex gap-2 z-10">
        {botoesAcao.map(({ to, icon: Icon, title }) => (
          <button
            key={to}
            className="p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title={title}
            onClick={() => navigate(to, { replace: true })}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>

      <div className="relative z-10 text-white flex flex-row gap-6 items-start justify-center w-full max-w-6xl px-4">
        <div className="flex-1 max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
              <Monitor size={20} className="text-blue-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Usuários do Sistema
            </h1>
          </div>
          <p className="text-sm text-white/60 text-center mb-4">
            Usuários com acesso às funcionalidades do sistema
          </p>

          <div className="max-h-[24rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {usuariosSistema.map((usuario) => (
              <CampoUsuario
                key={usuario.usuario_id}
                ativo={Boolean(usuario.usuario_ativo)}
                setVisualiza={setVisualiza}
                usuario={usuario}
                setUsuarioSelecionado={setUsuarioSelecionado}
              />
            ))}

            {usuariosSistema.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum usuário do sistema encontrado.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setCria(true)}
              className="px-4 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-200 shadow"
            >
              Adicionar Usuário
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
              <User size={20} className="text-emerald-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Funcionários
            </h1>
          </div>
          <p className="text-sm text-white/60 text-center mb-4">
            Acesso apenas ao registro de ponto e justificativas
          </p>

          <div className="max-h-[24rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {usuariosFuncionarios.map((usuario) => (
              <CampoUsuario
                key={usuario.usuario_id}
                ativo={Boolean(usuario.usuario_ativo)}
                setVisualiza={setVisualiza}
                usuario={usuario}
                setUsuarioSelecionado={setUsuarioSelecionado}
                tipoFuncionario={true}
              />
            ))}

            {usuariosFuncionarios.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum funcionário com acesso ao ponto encontrado.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setCria(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 shadow"
            >
              Adicionar Funcionário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuario;
