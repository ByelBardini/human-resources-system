function HeaderProjecao() {
  return (
    <thead className="text-white/90">
      <tr className="sticky top-0 z-10">
        <th
          rowSpan={2}
          className="bg-gradient-to-b from-white/15 to-white/5 text-left px-4 py-3 font-semibold tracking-wide border-b border-white/10"
        >
          Cargo
        </th>

        <th
          colSpan={4}
          className="bg-gradient-to-b from-sky-400/20 to-white/5 px-4 py-3 font-semibold text-center border-b border-white/10"
        >
          JUNIOR
        </th>
        <th
          colSpan={3}
          className="bg-gradient-to-b from-indigo-400/20 to-white/5 px-4 py-3 font-semibold text-center border-b border-white/10"
        >
          PLENO
        </th>
        <th
          colSpan={3}
          className="bg-gradient-to-b from-fuchsia-400/20 to-white/5 px-4 py-3 font-semibold text-center border-b border-white/10"
        >
          SENIOR
        </th>
      </tr>

      <tr className="sticky top-[44px] z-10 bg-white/5">
        <th className="px-3 py-2 text-center border-b border-white/10">
          INICIAL
        </th>
        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA III
        </th>

        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA II
        </th>
        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA III
        </th>

        <th className="px-3 py-2 text-center border-b border-white/10">
          FAIXA I
        </th>
        <th className="px-3 py-2 text-center border-white/10">FAIXA II</th>
        <th className="px-3 py-2 text-center border-white/10">FAIXA III</th>
      </tr>

      <tr className="sticky top-[80px] z-10 bg-white/3 text-[11px] text-white/70">
        <th className="px-4 py-1 text-left border-b border-white/10"> </th>
        <th className="px-3 py-1 text-center border-b border-white/10"> </th>
        <th className="px-3 py-1 text-center border-b border-white/10">5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">6,5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">6,5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">6,5%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">7%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">7%</th>
        <th className="px-3 py-1 text-center border-b border-white/10">7%</th>
      </tr>
    </thead>
  );
}

export default HeaderProjecao;
