import { Undo2 } from "lucide-react";
import MenuOpcoes from "./MenuOpcoes.jsx";

function Header({ opcaoSelecionada, setOpcaoSelecionada, onSair }) {
  const empresaNome = localStorage.getItem("empresa_nome") || "EMPRESA NOME";
  const empresaCor = localStorage.getItem("empresa_cor") || "#0ea5e9";

  return (
    <header className="w-full fixed top-0 left-0 z-50 border-b border-white/10 shadow-md overflow-visible">
      <div
        className="absolute top-0 left-0 w-full h-12 pointer-events-none z-0"
        style={{
          background: `linear-gradient(to right, transparent, ${empresaCor}aa, transparent)`,
          transformOrigin: "center",
          animation: "expandX 15s ease-in-out infinite",
          "@keyframes expandX": {
            "7%": { transform: "scaleX(0)" },
            "50%": { transform: "scaleX(1)" },
            "100%": { transform: "scaleX(0)" },
          },
        }}
      />

      <div className="relative w-full px-6 py-3 flex items-center justify-between backdrop-blur-xl z-10">
        <MenuOpcoes
          opcaoSelecionada={opcaoSelecionada}
          setOpcaoSelecionada={setOpcaoSelecionada}
        />

        <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-white drop-shadow-md">
          {empresaNome}
        </div>

        <button
          onClick={onSair}
          className="p-2 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors shadow-md"
          title="Sair"
        >
          <Undo2 size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;
