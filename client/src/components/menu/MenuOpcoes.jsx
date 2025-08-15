function MenuOpcoes({ setOpcaoSelecionada, opcaoSelecionada }) {
  const botoes = [
    { id: "home", label: "Home" },
    { id: "distribuicaoSalarial", label: "Distribuição Salarial" },
    { id: "projecaoSalarial", label: "Projeção Salarial" },
    { id: "manualFuncoes", label: "Manual Descritivo de Funções" },
  ];

  function seleciona(id_selecionado) {
    localStorage.setItem("aba_inicial", id_selecionado);
    setOpcaoSelecionada(id_selecionado);
  }

  return (
    <div className="flex gap-3 w-full h-full items-center justify-center">
      {botoes.map((btn) => (
        <button
          key={btn.id}
          onClick={() => seleciona(btn.id)}
          className={`cursor-pointer px-4 py-2 rounded-lg border border-white/10 transition-colors text-xl
            ${
              opcaoSelecionada === btn.id
                ? "bg-white/20 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export default MenuOpcoes;
