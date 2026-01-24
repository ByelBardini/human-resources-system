/* eslint-disable react-hooks/exhaustive-deps */
import {
  LogOut,
  UsersRound,
  Clock,
  Building2,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { getEmpresas } from "../services/api/empresasService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import ModalTrocaSenha from "../components/usuarios/ModalTrocaSenha.jsx";
import CampoEmpresa from "../components/empresas/CampoEmpresa.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import { usePermissao } from "../hooks/usePermissao.js";

function Home() {
  const { mostrarAviso, limparAviso } = useAviso();

  const navigate = useNavigate();

  const { temPermissao } = usePermissao();

  const [carregando, setCarregando] = useState(false);
  const [trocaSenha, setTrocaSenha] = useState(false);

  const [empresas, setEmpresas] = useState([]);

  async function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  async function buscarEmpresas() {
    setCarregando(true);
    try {
      const empresasData = await getEmpresas();
      setEmpresas(empresasData);
      setCarregando(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        setCarregando(false);
        mostrarAviso("erro", err.message, true);
      }
    }
  }

  useEffect(() => {
    buscarEmpresas();
    setTrocaSenha(localStorage.getItem("usuario_troca_senha") == 1);
    document.title = "Home - Sistema RH";
  }, []);

  const podeGerenciarPontos =
    temPermissao("ponto.aprovar_justificativas") ||
    temPermissao("ponto.alterar_batidas");

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {trocaSenha && (
        <ModalTrocaSenha
          setTrocaSenha={setTrocaSenha}
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

      <div className="absolute top-6 left-6 flex gap-2 z-10">
        {temPermissao("usuarios.gerenciar") && (
          <button
            className="cursor-pointer p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title="Gerenciar Usuários"
            onClick={() => navigate("/usuario", { replace: true })}
          >
            <UsersRound size={20} />
          </button>
        )}
        {temPermissao("sistema.gerenciar_empresas") && (
          <button
            className="cursor-pointer p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title="Gerenciar Empresas"
            onClick={() => navigate("/gerenciar-empresas", { replace: true })}
          >
            <Building2 size={20} />
          </button>
        )}
        {temPermissao("sistema.gerenciar_feriados") && (
          <button
            className="cursor-pointer p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title="Gerenciar Feriados"
            onClick={() => navigate("/gerenciar-feriados", { replace: true })}
          >
            <Calendar size={20} />
          </button>
        )}
        {temPermissao("sistema.gerenciar_ferias") && (
          <button
            className="cursor-pointer p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title="Gerenciar Férias"
            onClick={() => navigate("/gerenciar-ferias", { replace: true })}
          >
            <CalendarDays size={20} />
          </button>
        )}
      </div>

      {carregando && <Loading />}

      <div className="overflow-x-hidden overflow-y-auto text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <h1 className="text-2xl font-semibold text-white mb-1 text-center pb-8">
            Selecione a empresa desejada
          </h1>
          <CampoEmpresa empresas={empresas} navigate={navigate} />

          {/* Botão de Gerenciar Pontos dos Funcionários */}
          {podeGerenciarPontos && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => navigate("/gerenciar-pontos")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors font-semibold"
              >
                <Clock size={20} />
                Pontos dos Funcionários
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
