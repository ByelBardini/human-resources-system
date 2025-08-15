import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

function FiltroCargos({ cargos }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    const handleDown = (e) => {
      if (!open) return;
      if (
        popRef.current &&
        btnRef.current &&
        !popRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block z-25">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl
                   bg-white/10 border border-white/15 text-white/90 backdrop-blur
                   hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 z-25"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Mais opções"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div ref={popRef} className="absolute left-0 mt-2 z-50">
          <div className="relative">
            <span className="absolute -top-1 left-3 w-2 h-2 rotate-45 bg-blue-950 border-l border-t border-black/30" />
            <div
              role="menu"
              className="w-64 max-h-100 overflow-y-auto overflow-x-hidden
             rounded-xl border border-white/20 bg-slate-900
             backdrop-blur-md shadow-2xl p-2 overscroll-contain"
            >
              <ul className="space-y-1">
                {cargos.map((cargo) => (
                  <li key={cargo.cargo_id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left
                     text-white/95 bg-slate-800/90 border border-white/10
                     hover:bg-slate-700/90 hover:border-white/20
                     focus:outline-none focus:ring-2 focus:ring-white/20 transition"
                    >
                      <span className="block truncate">{cargo.cargo_nome}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FiltroCargos;
