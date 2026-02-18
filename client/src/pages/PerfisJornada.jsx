/* eslint-disable react-hooks/exhaustive-deps */
import { Undo2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { listarPerfisJornada } from "../services/api/perfilJornadaService.js";
import { useAviso } from "../context/AvisoContext.jsx";
import Loading from "../components/default/Loading.jsx";
import Background from "../components/default/Background.jsx";
import ModalCriaPerfilJornada from "../components/perfisJornada/ModalCriaPerfilJornada.jsx";
import { formatarHorasParaHHMM } from "../utils/formatarHoras.js";

function PerfisJornada() {
  const navigate = useNavigate();

  const [perfis, setPerfis] = useState([]);
  const [cria, setCria] = useState(false);
  const [atualizado, setAtualizado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();

  async function buscaPerfis() {
    setCarregando(true);
    try {
      const data = await listarPerfisJornada();
      setPerfis(data.perfis || []);
      setAtualizado(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscaPerfis();
    document.title = "Perfis de Jornada - Atlas";
  }, [atualizado]);


  const diasSemana = [
    { nome: "Segunda", campo: "perfil_jornada_segunda" },
    { nome: "Terça", campo: "perfil_jornada_terca" },
    { nome: "Quarta", campo: "perfil_jornada_quarta" },
    { nome: "Quinta", campo: "perfil_jornada_quinta" },
    { nome: "Sexta", campo: "perfil_jornada_sexta" },
    { nome: "Sábado", campo: "perfil_jornada_sabado" },
    { nome: "Domingo", campo: "perfil_jornada_domingo" },
  ];

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {cria && (
        <ModalCriaPerfilJornada
          setCria={setCria}
          setCarregando={setCarregando}
          setCadastrado={setAtualizado}
          cadastrado={atualizado}
          navigate={navigate}
        />
      )}

      {carregando && <Loading />}

      <button
        className="absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Voltar"
        onClick={() => navigate("/usuario", { replace: true })}
      >
        <Undo2 size={20} />
      </button>

      <div className="relative z-10 text-white flex flex-col gap-5 items-center justify-center w-full max-w-6xl px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">Perfis de Carga Horária</h1>
            <button
              onClick={() => setCria(true)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <Plus size={18} />
              Criar Perfil
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3">
            {perfis.map((perfil) => (
              <div
                key={perfil.perfil_jornada_id}
                className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4"
              >
                <h2 className="text-lg font-semibold text-white mb-3">
                  {perfil.perfil_jornada_nome}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-3">
                  {diasSemana.map((dia) => (
                    <div
                      key={dia.campo}
                      className="bg-white/5 rounded-lg p-2 border border-white/10"
                    >
                      <p className="text-white/70 text-xs mb-1">{dia.nome}</p>
                      <p className="text-white font-semibold text-sm">
                        {formatarHorasParaHHMM(parseFloat(perfil[dia.campo] || 0))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span>Intervalo mínimo: {perfil.perfil_jornada_intervalo_minimo} minutos</span>
                </div>
              </div>
            ))}

            {perfis.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                Nenhum perfil encontrado. Clique em "Criar Perfil" para adicionar um novo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerfisJornada;

