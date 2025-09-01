/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUsuario } from "../services/api/usuariosServices.js";
import { useAviso } from "../context/AvisoContext.jsx";
import ModalAviso from "../components/default/ModalAviso.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background";
import CampoUsuario from "../components/usuarios/CampoUsuario.jsx";
import ModalUsuario from "../components/usuarios/ModalVisualizaUsuario.jsx";
import ModalCriaUsuario from "../components/usuarios/ModalCriaUsuario.jsx";

function Usuario() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState();

  const [visualiza, setVisualiza] = useState(false);
  const [cria, setCria] = useState(false);
  const [atualizado, setAtualizado] = useState(false);

  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();

  async function buscaUsuarios() {
    try {
      const usuarios = await getUsuario();
      setUsuarios(usuarios);
      setAtualizado(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        console.erro(err);
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", "Erro ao buscar usuários:", true);
        console.error(err);
      }
    }
  }

  useEffect(() => {
    buscaUsuarios();
    document.title = "Usuários - Sistema RH";
  }, [atualizado]);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {/* {aviso && (
        <ModalAviso texto={textoAviso} cor={corAviso} onClick={limparAviso} />
      )} */}
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
        className="cursor-pointer absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={() => navigate("/home", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="text-white flex flex-col gap-5 items-center justify-center w-full">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <h1 className="text-2xl font-semibold text-white mb-4 text-center">
            Usuários disponíveis
          </h1>

          <div className="max-h-[28rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {usuarios.map((usuario) => (
              <CampoUsuario
                ativo={Boolean(usuario.usuario_ativo)}
                setVisualiza={setVisualiza}
                usuario={usuario}
                setUsuarioSelecionado={setUsuarioSelecionado}
              />
            ))}

            {usuarios.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setCria(true)}
              className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
            >
              Adicionar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuario;
