import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";
import { getNotificacoesMes } from "../../services/api/notificacoesServices.js";

function FiltroNotificacoes({
  dataInicial,
  dataFinal,
  setDataFinal,
  setDataInicial,
  setFiltroAtivo,
  setFiltradas,
  setAviso,
  setCorAviso,
  setTextoAviso,
}) {
  const [valido, setValido] = useState(false);

  async function busca() {
    const id = localStorage.getItem("funcionario_id");
    try {
      const filtrados = await getNotificacoesMes(id, dataInicial, dataFinal);
      setFiltradas(filtrados);
      setFiltroAtivo(true);
    } catch (err) {
      setCorAviso("vermelho");
      setTextoAviso("Erro ao aplicar filtro de data:", err);
      setAviso(true);
      console.error(err);
    }
  }

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const popW = 288;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - 8 - popW);
    setPos({ top: r.top - 8, left });
  };

  function abre() {
    setOpen(!open);
    setDataFinal("");
    setDataInicial("");
  }

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    const onDown = (e) => {
      if (!popRef.current || !btnRef.current) return;
      if (
        !popRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const onKey = (e) => e.key === "Escape" && setOpen(false);

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (dataFinal != "" && dataInicial != "") {
      setValido(true);
    } else {
      setValido(false);
    }
  }, [dataInicial, dataFinal]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={abre}
        className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-white"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Filtro por período"
      >
        <Filter size={16} /> Filtro
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-75"
            style={{
              top: pos.top,
              left: pos.left,
              transform: "translateY(-100%)",
            }}
          >
            <span className="absolute -bottom-1 left-4 w-2 h-2 rotate-45 bg-slate-900 border-r border-b border-white/20" />
            <div
              role="menu"
              className="w-72 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-3 text-white"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">De</label>
                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:bg-white/15 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Até
                  </label>
                  <input
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:bg-white/15 [color-scheme:dark]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </button>
                  {valido && (
                    <button
                      type="button"
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/20 border border-white/10 hover:bg-white/30"
                      onClick={busca}
                    >
                      Aplicar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default FiltroNotificacoes;
