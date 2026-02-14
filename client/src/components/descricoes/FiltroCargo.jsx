import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Briefcase } from "lucide-react";

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

  const qtdSelecionados = descricaoFiltro.length;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex gap-2 px-3 py-2 items-center rounded-lg border transition-all text-sm
          ${open || qtdSelecionados > 0
            ? "bg-white/10 border-white/20 text-white"
            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Briefcase size={14} className="text-white/50" />
        <span>Função</span>
        {qtdSelecionados > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-md">{qtdSelecionados}</span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[200]"
            style={{ top: pos.top, left: pos.left }}
          >
            <div
              role="menu"
              className="w-56 max-h-72 overflow-y-auto overflow-x-hidden
                         rounded-xl border border-white/15 bg-slate-900/95
                         backdrop-blur-xl shadow-2xl py-1.5 text-white"
            >
              {descricoes.map((descricao) => {
                const selecionado = descricaoFiltro.some(
                  (d) => d.descricao_id === descricao.descricao_id
                );
                return (
                  <button
                    key={descricao.descricao_id}
                    type="button"
                    onClick={() => clica(descricao)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors text-sm
                      ${selecionado
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5"
                      }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${selecionado ? "bg-white/20 border-white/30" : "border-white/20"}`}>
                      {selecionado && <Check size={12} />}
                    </div>
                    <span className="truncate">{descricao.cargo.cargo_nome}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default FiltroCargo;
