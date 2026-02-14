import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

function FiltroCargos({ cargos, setCargosFiltro, cargosFiltro }) {
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (busca.trim() === "") {
      setCargosFiltro([]);
    } else {
      const termo = busca.toLowerCase().trim();
      const filtrados = cargos.filter((cargo) =>
        cargo.cargo_nome?.toLowerCase().includes(termo)
      );
      setCargosFiltro(filtrados);
    }
  }, [busca, cargos, setCargosFiltro]);

  function limparBusca() {
    setBusca("");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar função..."
          className="h-8 pl-8 pr-3 rounded-md border border-white/10 bg-white/5 text-white/90 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors w-48"
        />
      </div>
      {busca && (
        <button
          type="button"
          onClick={limparBusca}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-colors focus:outline-none"
        >
          <X size={14} />
          Limpar
        </button>
      )}
    </div>
  );
}

export default FiltroCargos;
