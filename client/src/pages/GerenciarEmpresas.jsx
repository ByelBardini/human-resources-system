/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTodasEmpresas, getEmpresaImagem } from "../services/api/empresasService.js";
import { useAviso } from "../context/AvisoContext.jsx";
import { useAuthError } from "../hooks/useAuthError.js";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background";
import CampoEmpresaGerenciamento from "../components/empresas/CampoEmpresaGerenciamento.jsx";
import ModalEditaEmpresa from "../components/empresas/ModalEditaEmpresa.jsx";
import ModalCriaEmpresa from "../components/empresas/ModalCriaEmpresa.jsx";
import { usePermissao } from "../hooks/usePermissao.js";
import logger from "../utils/logger.js";

function GerenciarEmpresas() {
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState();

  const [visualiza, setVisualiza] = useState(false);
  const [cria, setCria] = useState(false);
  const [atualizado, setAtualizado] = useState(false);

  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();
  const { temPermissao } = usePermissao();

  async function buscaEmpresas() {
    setCarregando(true);
    try {
      const empresasData = await getTodasEmpresas();
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
      setAtualizado(false);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError(setCarregando);
      } else {
        mostrarAviso("erro", "Erro ao buscar empresas:", true);
      }
      logger.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!temPermissao("sistema.gerenciar_empresas")) {
      mostrarAviso("erro", "Você não tem permissão para acessar esta página!");
      navigate("/home", { replace: true });
      return;
    }
    
    buscaEmpresas();
    document.title = "Gerenciar Empresas - Atlas";
  }, [atualizado]);

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {cria && (
        <ModalCriaEmpresa
          setCria={setCria}
          setCarregando={setCarregando}
          setCadastrado={setAtualizado}
          cadastrado={atualizado}
          navigate={navigate}
        />
      )}
      {visualiza && (
        <ModalEditaEmpresa
          setEdita={setVisualiza}
          empresaSelecionada={empresaSelecionada}
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

      <div className="relative z-10 text-white flex flex-col items-center justify-center w-full max-w-4xl px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
              <Building2 size={20} className="text-blue-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Gerenciar Empresas
            </h1>
          </div>
          <p className="text-sm text-white/60 text-center mb-4">
            Cadastre, edite ou inative empresas do sistema
          </p>

          <div className="max-h-[32rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {empresas.map((empresa) => (
              <CampoEmpresaGerenciamento
                key={empresa.empresa_id}
                ativo={Boolean(empresa.empresa_ativo)}
                setEdita={setVisualiza}
                empresa={empresa}
                setEmpresaSelecionada={setEmpresaSelecionada}
              />
            ))}

            {empresas.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhuma empresa encontrada.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setCria(true)}
              className="px-4 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-200 shadow"
            >
              Adicionar Empresa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GerenciarEmpresas;
