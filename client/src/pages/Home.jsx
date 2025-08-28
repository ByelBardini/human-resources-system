/* eslint-disable react-hooks/exhaustive-deps */
import { LogOut, UsersRound } from "lucide-react";
import { logout } from "../services/auth/authService.js";
import { getEmpresas } from "../services/api/empresasService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalTrocaSenha from "../components/usuarios/ModalTrocaSenha.jsx";
import CampoEmpresa from "../components/empresas/CampoEmpresa.jsx";
import Loading from "../components/default/Loading.jsx";
import ModalAviso from "../components/default/ModalAviso.jsx";
import Background from "../components/default/Background.jsx";

function Home() {
  const navigate = useNavigate();

  const role = localStorage.getItem("usuario_role");

  const [carregando, setCarregando] = useState(false);
  const [trocaSenha, setTrocaSenha] = useState(false);

  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");

  const [empresas, setEmpresas] = useState([]);

  async function deslogar() {
    await logout();
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarEmpresas() {
    setCarregando(true);
    try {
      const empresasData = await getEmpresas();
      console.log(empresasData);
      setEmpresas(empresasData);
      setCarregando(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        console.log(err);
        setCarregando(false);
        setCorAviso("vermelho");
        setTextoAviso("Sessão inválida! Realize o Login novamente!");
        setAviso(true);
        setTimeout(() => {
          setAviso(false);
          navigate("/", { replace: true });
        }, 1000);
      } else {
        setCarregando(false);
        setCorAviso("vermelho");
        setTextoAviso(err.message);
        setAviso(true);
      }
    }
  }

  useEffect(() => {
    buscarEmpresas();
    setTrocaSenha(localStorage.getItem("usuario_troca_senha") == 1);
    document.title = "Home - Sistema RH";
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {trocaSenha && (
        <ModalTrocaSenha
          setTrocaSenha={setTrocaSenha}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
          navigate={navigate}
        />
      )}

      <button
        className="cursor-pointer absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      {role == "adm" && (
        <button
          className="cursor-pointer absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
          title="Sair"
          onClick={() => navigate("/usuario", { replace: true })}
        >
          <UsersRound size={20} />
        </button>
      )}

      {aviso && (
        <ModalAviso
          texto={textoAviso}
          cor={corAviso}
          onClick={() => setAviso(false)}
        />
      )}

      {carregando && <Loading />}

      <div className="overflow-x-hidden overflow-y-hidden text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <h1 className="text-2xl font-semibold text-white mb-1 text-center pb-8">
            Selecione a empresa desejada
          </h1>
          <CampoEmpresa empresas={empresas} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}

export default Home;
