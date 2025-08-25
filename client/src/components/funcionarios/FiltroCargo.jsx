import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

function FiltroCargo({
  funcionarios = [],
  setFuncionarioFiltro,
  funcionarioFiltro,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const cargos = [
    ...new Set(
      (funcionarios ?? [])
        .map((f) => f.cargo?.cargo_nome?.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  function clica(cargoNome) {
    const selecionado = funcionarioFiltro.includes(cargoNome);

    setFuncionarioFiltro((prev) =>
      selecionado ? prev.filter((c) => c !== cargoNome) : [...prev, cargoNome]
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
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/90 text-[13px] leading-none tracking-tight hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
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
                {cargos.map((cargo) => {
                  const selecionado = funcionarioFiltro.includes(cargo);
                  return (
                    <li key={cargo}>
                      <button
                        type="button"
                        onClick={() => clica(cargo)}
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
                          {cargo.charAt(0).toUpperCase() + cargo.slice(1)}
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
