import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

function FiltroCargo({
  descricoes,
  setDescricaoFiltro,
  descricaoFiltro,
}) {

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0 });

  function clica(opcao) {
    const id = opcao.descricao_id;
    const nome = opcao.cargo.cargo_nome;
    setDescricaoFiltro((prev) =>
      prev.some((d) => d.descricao_id === id)
        ? prev.filter((c) => c.descricao_id !== id)
        : [
            ...prev,
            {
              ...{
                descricao_id: id,
                cargo: { cargo_nome: nome },
                filtrado: true,
              },
            },
          ]
    );
  }

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(Math.max(16, r.left), window.innerWidth - 16 - 256);
    setPos({ top: r.bottom + 8, left });
  };

  useEffect(() => {
    if (!open) return;

    updatePos();

    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    const handleDown = (e) => {
      if (!popRef.current || !btnRef.current) return;
      if (
        !popRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex gap-3 p-2 items-center rounded-lg border border-white/10 transition-colors text-xl bg-white/5 text-white hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Mais opções"
      >
        Função <ChevronDown />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="fixed"
            style={{ top: pos.top, left: pos.left }}
          >
            <span className="absolute -top-1 left-6 w-2 h-2 rotate-45 bg-slate-900 border-l border-t border-white/20" />
            <div
              role="menu"
              className="w-64 max-h-100 overflow-y-auto overflow-x-hidden
                         rounded-xl border border-white/20 bg-slate-900
                         backdrop-blur-md shadow-2xl p-2 text-white"
            >
              <ul className="space-y-1">
                {descricoes.map((descricao) => {
                  const selecionado = descricaoFiltro.some(
                    (d) => d.descricao_id === descricao.descricao_id
                  );
                  return (
                    <li key={descricao.descricao_id}>
                      <button
                        type="button"
                        onClick={() => clica(descricao)}
                        className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition
                          ${
                            selecionado
                              ? "bg-slate-700/90 border-white/20 text-white"
                              : "bg-slate-800/90 border-white/10 text-white/90 hover:bg-slate-700/90 hover:border-white/20"
                          } 
                          border focus:outline-none focus:ring-2 focus:ring-white/20`}
                      >
                        {selecionado && (
                          <Check size={16} className="shrink-0" />
                        )}
                        <span className="block truncate">
                          {descricao.cargo.cargo_nome}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default FiltroCargo;
