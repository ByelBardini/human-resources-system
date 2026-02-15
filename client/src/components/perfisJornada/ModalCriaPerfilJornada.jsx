import { X, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { criarPerfilJornada } from "../../services/api/perfilJornadaService.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalCriaPerfilJornada({
  setCria,
  setCarregando,
  setCadastrado,
  cadastrado,
  navigate,
}) {
  const { mostrarAviso, limparAviso } = useAviso();

  const [nome, setNome] = useState("");
  const [segunda, setSegunda] = useState("");
  const [terca, setTerca] = useState("");
  const [quarta, setQuarta] = useState("");
  const [quinta, setQuinta] = useState("");
  const [sexta, setSexta] = useState("");
  const [sabado, setSabado] = useState("");
  const [domingo, setDomingo] = useState("");
  const [intervaloMinimo, setIntervaloMinimo] = useState("60");

  async function criaPerfil() {
    if (!nome) {
      mostrarAviso("erro", "Nome do perfil é obrigatório", true);
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        nome,
        segunda: parseFloat(segunda) || 0,
        terca: parseFloat(terca) || 0,
        quarta: parseFloat(quarta) || 0,
        quinta: parseFloat(quinta) || 0,
        sexta: parseFloat(sexta) || 0,
        sabado: parseFloat(sabado) || 0,
        domingo: parseFloat(domingo) || 0,
        intervaloMinimo: parseInt(intervaloMinimo) || 60,
      };

      await criarPerfilJornada(payload);

      mostrarAviso("sucesso", "Perfil de jornada criado com sucesso!", true);

      setCadastrado(true);
      setCria(false);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
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
    setSegunda("");
    setTerca("");
    setQuarta("");
    setQuinta("");
    setSexta("");
    setSabado("");
    setDomingo("");
    setIntervaloMinimo("60");
  }, [cadastrado]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setCria(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Criar Perfil de Carga Horária</h2>
          <button
            className="rounded-lg p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Fechar"
            onClick={() => setCria(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Nome do Perfil *</label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: Jornada 8h Seg-Sex"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Horas por Dia da Semana</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Segunda", value: segunda, setter: setSegunda },
                { label: "Terça", value: terca, setter: setTerca },
                { label: "Quarta", value: quarta, setter: setQuarta },
                { label: "Quinta", value: quinta, setter: setQuinta },
                { label: "Sexta", value: sexta, setter: setSexta },
                { label: "Sábado", value: sabado, setter: setSabado },
                { label: "Domingo", value: domingo, setter: setDomingo },
              ].map((dia) => (
                <div key={dia.label}>
                  <label className="block text-xs text-white/70 mb-1">{dia.label}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={dia.value}
                    onChange={(e) => dia.setter(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30 text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-white/60 mt-2">
              Informe as horas em formato decimal (ex: 8.5 para 8h30min)
            </p>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">
              Intervalo Mínimo (minutos) *
            </label>
            <input
              type="number"
              min="0"
              value={intervaloMinimo}
              onChange={(e) => setIntervaloMinimo(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="60"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={criaPerfil}
            className="inline-flex items-center gap-2 rounded-lg border bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25 px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCriaPerfilJornada;

