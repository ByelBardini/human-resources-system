import { Pencil, Building2 } from "lucide-react";

function CampoEmpresaGerenciamento({
  setEdita,
  ativo = true,
  empresa,
  setEmpresaSelecionada,
}) {
  function clica() {
    setEmpresaSelecionada(empresa);
    setEdita(true);
  }

  return (
    <div
      className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 flex items-center justify-between"
    >
      <div className="min-w-0 flex items-center gap-3">
        {empresa.empresa_imagem ? (
          <img
            src={empresa.empresa_imagem}
            alt={empresa.empresa_nome}
            className="w-12 h-12 rounded-lg object-cover border border-white/10"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Building2 size={24} className="text-white/40" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white leading-tight truncate">
            {empresa.empresa_nome}
          </h2>
          <p className="text-sm text-white/70 leading-tight truncate">
            CNPJ: {empresa.empresa_cnpj}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4 flex-wrap justify-end">
        <span
          className={`px-2 py-[2px] text-xs font-medium rounded-full ${
            ativo
              ? "bg-green-500/20 border border-green-400/30 text-green-300"
              : "bg-red-500/20 border border-red-400/30 text-red-300"
          }`}
        >
          {ativo ? "Ativa" : "Inativa"}
        </span>

        <div
          className="w-6 h-6 rounded border border-white/20"
          style={{ backgroundColor: empresa.empresa_cor }}
          title={`Cor: ${empresa.empresa_cor}`}
        />

        <button
          onClick={clica}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>
    </div>
  );
}

export default CampoEmpresaGerenciamento;
