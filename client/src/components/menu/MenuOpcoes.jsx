import {
  House,
  Handshake,
  DiamondPlus,
  ChartLine,
  BookMarked,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function MenuOpcoes({ setOpcaoSelecionada, opcaoSelecionada }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const botoesPrincipais = [
    { id: "home", icon: <House size={20} /> },
    { id: "funcionarios", icon: <Handshake size={20} /> },
  ];

  const botoesExtrasCargo = [
    { id: "projecaoSalarial", label: "Projeção Salarial", icon: <ChartLine /> },
    { id: "manualFuncoes", label: "Manual Funções", icon: <BookMarked /> },
  ];

  function seleciona(id_selecionado) {
    localStorage.setItem("aba_inicial", id_selecionado);
    setOpcaoSelecionada(id_selecionado);
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex gap-3 w-full h-full items-center justify-start">
      {botoesPrincipais.map((btn) => (
        <button
          key={btn.id}
          onClick={() => seleciona(btn.id)}
          className={`cursor-pointer px-4 py-2 rounded-lg bg-white/7 border border-white/15 transition-colors text-xl flex items-center justify-center
            ${
              opcaoSelecionada === btn.id
                ? "bg-white/20 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
        >
          {btn.icon}
          {btn.label}
        </button>
      ))}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className={`cursor-pointer px-4 py-2 rounded-lg border bg-white/7 border-white/15 transition-colors text-xl flex items-center justify-center
      ${
        open || ["projecaoSalarial", "manualFuncoes"].includes(opcaoSelecionada)
          ? "bg-white/15 text-white"
          : "bg-white/5 text-gray-300 hover:bg-white/10"
      }`}
        >
          <DiamondPlus size={20} />
        </button>

        {open && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col gap-2 p-2 rounded-lg bg-black/80 border border-white/10 shadow-lg z-50">
            {botoesExtrasCargo.map((btn) => (
              <button
                key={btn.id}
                onClick={() => seleciona(btn.id)}
                className={`cursor-pointer gap-2 px-4 py-2 rounded-lg border bg-white/10 border-white/15 transition-colors flex items-center justify-center whitespace-nowrap
                  ${
                    opcaoSelecionada === btn.id
                      ? "bg-white/20 text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
              >
                {btn.icon && btn.icon}
                {btn.label && <span>{btn.label}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuOpcoes;
