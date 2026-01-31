import { Pencil } from "lucide-react";

function CampoUsuario({
  setVisualiza,
  ativo = true,
  usuario,
  setUsuarioSelecionado,
  tipoFuncionario = false,
}) {
  function clica() {
    setUsuarioSelecionado(usuario);
    setVisualiza(true);
  }

  return (
    <div
      className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 flex items-center justify-between"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white leading-tight truncate">
          {usuario.usuario_nome}
        </h2>
        <p className="text-sm text-white/70 leading-tight truncate">
          {usuario.usuario_login}
        </p>
        {tipoFuncionario && usuario.funcionario && (
          <p className="text-xs text-white/50 leading-tight truncate mt-1">
            Funcionário: {usuario.funcionario.funcionario_nome}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4 flex-wrap justify-end">
        <span
          className={`px-2 py-[2px] text-xs font-medium rounded-full ${
            ativo
              ? "bg-green-500/20 border border-green-400/30 text-green-300"
              : "bg-red-500/20 border border-red-400/30 text-red-300"
          }`}
        >
          {ativo ? "Ativo" : "Inativo"}
        </span>

        {usuario.cargo && !tipoFuncionario && (
          <span className="px-2 py-[2px] text-xs font-medium rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">
            {usuario.cargo.cargo_usuario_nome}
          </span>
        )}

        {tipoFuncionario && (
          <span className="px-2 py-[2px] text-xs font-medium rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            Ponto
          </span>
        )}

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

export default CampoUsuario;
