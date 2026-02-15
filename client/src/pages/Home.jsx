/* eslint-disable react-hooks/exhaustive-deps */
import {
  LogOut,
  UsersRound,
  Clock,
  Building2,
  Calendar,
  CalendarDays,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { getEmpresas, getEmpresaImagem } from "../services/api/empresasService.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAviso } from "../context/AvisoContext.jsx";
import ModalTrocaSenha from "../components/usuarios/ModalTrocaSenha.jsx";
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

  function deslogar() {
    localStorage.clear();
    navigate("/", { replace: true });
  }

  function selecionarEmpresa(empresa) {
    localStorage.setItem("empresa_id", empresa.empresa_id);
    localStorage.setItem("empresa_nome", empresa.empresa_nome);
    localStorage.setItem("empresa_cor", empresa.empresa_cor);
    localStorage.setItem("aba_inicial", "home");
    navigate("/empresa", { replace: true });
  }

  async function buscarEmpresas() {
    setCarregando(true);
    try {
      const empresasData = await getEmpresas();
      const empresasComImagens = await Promise.all(
        empresasData.map(async (empresa) => {
          try {
            const imagem = await getEmpresaImagem(empresa.empresa_id);
            return { ...empresa, empresa_imagem: imagem };
          } catch {
            return { ...empresa, empresa_imagem: null };
          }
        })
      );
      setEmpresas(empresasComImagens);
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
    document.title = "Home - Atlas";
  }, []);

  const podeGerenciarPontos =
    temPermissao("ponto.aprovar_justificativas") ||
    temPermissao("ponto.alterar_batidas");

  const botoesAcao = [
    { permissao: "usuarios.gerenciar", to: "/usuario", icon: UsersRound, title: "Gerenciar Usuários" },
    { permissao: "sistema.gerenciar_empresas", to: "/gerenciar-empresas", icon: Building2, title: "Gerenciar Empresas" },
    { permissao: "sistema.gerenciar_feriados", to: "/gerenciar-feriados", icon: Calendar, title: "Gerenciar Feriados" },
    { permissao: "sistema.gerenciar_ferias", to: "/gerenciar-ferias", icon: CalendarDays, title: "Gerenciar Férias" },
    {
      permissao: "sistema.emitir_relatorios",
      to: "/emitir-relatorios",
      icon: FileSpreadsheet,
      title: "Emitir relatórios",
    },
  ].filter((b) => temPermissao(b.permissao));

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden antialiased">
      <Background />

      {trocaSenha && (
        <ModalTrocaSenha
          setTrocaSenha={setTrocaSenha}
          setCarregando={setCarregando}
          navigate={navigate}
        />
      )}

      <button
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={deslogar}
      >
        <LogOut size={20} />
      </button>

      <div className="absolute top-6 left-6 flex gap-2 z-10">
        {botoesAcao.map(({ to, icon: Icon, title, onClick }) => (
          <button
            key={to ?? title}
            className="p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
            title={title}
            onClick={onClick ?? (() => navigate(to, { replace: true }))}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>

      {carregando && <Loading />}

      <div className="relative z-10 flex justify-center items-center min-h-[60vh] overflow-x-hidden overflow-y-auto text-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/10 border border-white/10">
              <Building2 size={22} className="text-white/80" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium tracking-wide uppercase">
                {localStorage.getItem("usuario_nome") || "Usuário"}
              </p>
              <h1 className="text-base font-medium text-white/95 tracking-tight">
                Selecione a empresa
              </h1>
            </div>
          </div>
          <p className="text-sm text-white/50 mb-3">
            {empresas.length === 0
              ? "Carregando empresas..."
              : `${empresas.length} empresa${empresas.length !== 1 ? "s" : ""} disponíve${empresas.length !== 1 ? "is" : "l"}`}
          </p>

          {empresas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-4 p-5 rounded-xl bg-white/5 border border-white/5">
              {empresas.map((empresa) => {
                const cor = empresa.empresa_cor || "#64748b";
                return (
                  <button
                    key={empresa.empresa_id}
                    type="button"
                    onClick={() => selecionarEmpresa(empresa)}
                    className="relative flex items-center justify-center rounded-2xl p-3 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 logo-empresa-btn"
                  >
                    <span
                      className="logo-glow absolute inset-0 rounded-2xl blur-xl"
                      style={{ background: cor }}
                      aria-hidden
                    />
                    {empresa.empresa_imagem ? (
                      <img
                        src={empresa.empresa_imagem}
                        alt=""
                        className="relative z-10 w-20 h-20 rounded-xl object-contain border border-white/10 bg-white/5 p-1.5"
                      />
                    ) : (
                      <div className="relative z-10 w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                        <Building2 size={36} className="text-white/40" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {empresas.length === 0 && !carregando && (
            <p className="text-sm text-white/40 text-center py-4">Nenhuma empresa disponível</p>
          )}

          {(podeGerenciarPontos || localStorage.getItem("pode_bater_ponto") === "true") && (
            <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
              {localStorage.getItem("pode_bater_ponto") === "true" && (
                <button
                  onClick={() => navigate("/ponto")}
                  className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400/95 border border-blue-500/30 transition-colors font-medium tracking-tight text-sm group"
                >
                  <span className="flex items-center gap-2">
                    <Clock size={18} />
                    Batida de Ponto
                  </span>
                  <ChevronRight size={18} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              {podeGerenciarPontos && (
                <button
                  onClick={() => navigate("/gerenciar-pontos")}
                  className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400/95 border border-emerald-500/30 transition-colors font-medium tracking-tight text-sm group"
                >
                  <span className="flex items-center gap-2">
                    <Clock size={18} />
                    Pontos dos Funcionários
                  </span>
                  <ChevronRight size={18} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-white/30 mt-5 text-center">
            Atlas
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
