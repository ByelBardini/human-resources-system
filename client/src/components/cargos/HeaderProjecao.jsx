function HeaderProjecao({ filtroCargos }) {
  return (
    <thead className="text-white/90 bg-white/[0.03]">
      {/* Linha principal - Categorias */}
      <tr>
        <th
          rowSpan={3}
          className="min-w-[200px] text-left px-5 py-3 font-semibold text-sm tracking-wide border-r border-white/10"
        >
          <div className="flex items-center justify-between gap-2">
            <span>FUNÇÃO</span>
            {filtroCargos}
          </div>
        </th>

        <th
          colSpan={4}
          className="px-4 py-3 font-semibold text-sm tracking-wide text-center border-r border-white/10 text-sky-400"
        >
          JÚNIOR
        </th>
        <th
          colSpan={3}
          className="px-4 py-3 font-semibold text-sm tracking-wide text-center border-r border-white/10 text-purple-400"
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
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          INICIAL
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA III
        </th>

        {/* Pleno */}
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/10">
          FAIXA III
        </th>

        {/* Sênior */}
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70 border-r border-white/5">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center text-xs font-medium text-white/70">
          FAIXA III
        </th>
      </tr>

      {/* Linha de porcentagens */}
      <tr className="border-b border-white/10">
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/40 border-r border-white/5">
          —
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/10">
          +6,5%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +7%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50 border-r border-white/5">
          +7%
        </th>
        <th className="px-3 py-1.5 text-center text-[11px] font-normal text-white/50">
          +7%
        </th>
      </tr>
    </thead>
  );
}

export default HeaderProjecao;
