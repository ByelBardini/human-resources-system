import { useState, useRef, useEffect, memo } from "react";
import { Search, X } from "lucide-react";

function HeaderProjecao({ busca, setBusca }) {
  const [editando, setEditando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editando && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editando]);

  function handleClick() {
    setEditando(true);
  }

  function handleBlur() {
    if (!busca) {
      setEditando(false);
    }
  }

  function limparBusca() {
    setBusca("");
    setEditando(false);
  }

  return (
    <thead className="text-white/90 bg-white/[0.03]">
      {/* Linha principal - Categorias */}
      <tr>
        <th
          rowSpan={3}
          className="w-[260px] min-w-[260px] max-w-[260px] px-4 py-3 font-semibold text-sm tracking-wide border-r border-white/10"
        >
          {editando || busca ? (
            <div className="flex items-center gap-2">
              <Search size={14} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onBlur={handleBlur}
                placeholder="Buscar..."
                className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
              {busca && (
                <button
                  type="button"
                  onClick={limparBusca}
                  className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              className="w-full text-center hover:text-white/70 transition-colors cursor-pointer"
            >
              FUNÇÃO
            </button>
          )}
        </th>

        <th
          colSpan={4}
          className="px-4 py-3 font-semibold text-sm tracking-wide text-center border-r-2 border-white/20 text-sky-400"
        >
          JÚNIOR
        </th>
        <th
          colSpan={3}
          className="px-4 py-3 font-semibold text-sm tracking-wide text-center border-r-2 border-white/20 text-purple-400"
        >
          PLENO
        </th>
        <th
          colSpan={3}
          className="px-4 py-3 font-semibold text-sm tracking-wide text-center text-orange-400"
        >
          SÊNIOR
        </th>
      </tr>

      {/* Linha secundária - Faixas */}
      <tr className="bg-white/[0.02]">
        {/* Júnior */}
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          INICIAL
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r-2 border-white/25">
          FAIXA III
        </th>

        {/* Pleno */}
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r-2 border-white/25">
          FAIXA III
        </th>

        {/* Sênior */}
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70">
          FAIXA III
        </th>
      </tr>

      {/* Linha de porcentagens */}
      <tr className="border-b border-white/10">
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/40 border-r border-white/10">
          —
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r-2 border-white/25">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r-2 border-white/25">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +7%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +7%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50">
          +7%
        </th>
      </tr>
    </thead>
  );
}

export default memo(HeaderProjecao);
