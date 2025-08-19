function FiltrosDescricao() {
  return (
    <div className="w-full rounded-lg border border-white/10 transition-colors text-xl bg-white/5 backdrop-blur-xl p-2">
      <div className="w-full flex gap-3 justify-center">
        <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
          Setor
        </div>
        <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
          Cargo
        </div>
      </div>
    </div>
  );
}

export default FiltrosDescricao;
