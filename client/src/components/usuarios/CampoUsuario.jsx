import { Pencil } from "lucide-react";

function CampoUsuario({
  setVisualiza,
  ativo = true,
  usuario,
  setUsuarioSelecionado,
}) {
  function clica() {
    setUsuarioSelecionado(usuario);
    setVisualiza(true);
  }
  return (
    <div
      key={usuario.usuario_id}
      className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 flex items-center justify-between"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white leading-tight truncate">
          {usuario.usuario_nome}
        </h2>
        <p className="text-sm text-white/70 leading-tight truncate">
          {usuario.usuario_login}
        </p>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <span
          className={`px-2 py-[2px] text-xs font-medium rounded-full ${
            ativo
              ? "bg-green-500/20 border border-green-400/30 text-green-300"
              : "bg-red-500/20 border border-red-400/30 text-red-300"
          }`}
        >
          {ativo ? "Ativo" : "Inativo"}
        </span>

        {usuario.funcionario ? (
          <span className="px-2 py-[2px] text-xs font-medium rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300">
            Funcionário
          </span>
        ) : (
          <span className="px-2 py-[2px] text-xs font-medium rounded-full bg-gray-500/20 border border-gray-400/30 text-gray-300">
            Usuário
          </span>
        )}

        {usuario.cargo && (
          <span className="px-2 py-[2px] text-xs font-medium rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">
            {usuario.cargo.cargo_usuario_nome}
          </span>
        )}

        <button
          onClick={clica}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>
    </div>
  );
}

export default CampoUsuario;
