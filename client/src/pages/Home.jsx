import { LogOut } from "lucide-react";
import { logout } from "../services/auth/authService.js";
import { getEmpresas } from "../services/api/empresasService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CampoEmpresa from "../components/empresas/CampoEmpresa.jsx";
import Loading from "../components/default/Loading.jsx";
import ModalAviso from "../components/default/ModalAviso.jsx";

function Home() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(false);

  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");

  const [empresas, setEmpresas] = useState([]);

  async function deslogar() {
    await logout();
    localStorage.clear();
    window.location.href = "/";
  }

  async function buscarEmpresas() {
    setCarregando(true);
    try {
      const empresasData = await getEmpresas();
      console.log(empresasData);
      setEmpresas(empresasData);
      setCarregando(false);
    } catch (err) {
      setCarregando(false);
      setCorAviso("vermelho");
      setTextoAviso(err.message);
      setAviso(true);
    }
  }

  useEffect(() => {
    buscarEmpresas();
    document.title = "Home - Sistema RH";
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-blue-950" />
        <div className="absolute top-1/4 left-[15%] w-[300px] h-[300px] bg-indigo-950/40 rounded-full blur-3xl" />
        <div className="absolute top-[70%] left-[10%] w-[250px] h-[250px] bg-cyan-900/30 rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[20%] w-[280px] h-[280px] bg-teal-900/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[15%] right-[10%] w-[320px] h-[320px] bg-red-950/20 rounded-full blur-3xl" />
        <div className="absolute top-[50%] left-[45%] w-[200px] h-[200px] bg-amber-900/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />

      </div>

      <button
        className="cursor-pointer absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

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
