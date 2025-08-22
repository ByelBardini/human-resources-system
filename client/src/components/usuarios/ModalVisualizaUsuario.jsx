import { X, Save, Power, RotateCcw } from "lucide-react";

function ModalUsuario({ usuarioSelecionado, setVisualiza }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setVisualiza(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Editar usuário</h2>
          <button
            className="rounded-lg p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Fechar"
            onClick={() => setVisualiza(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: Maria da Silva"
              disabled
              value={usuarioSelecionado.usuario_nome}
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Login</label>
            <input
              type="text"
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: maria.silva"
              disabled
              value={usuarioSelecionado.usuario_login}
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">
              Tipo de Usuário
            </label>
            <input
              type="text"
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: maria.silva"
              disabled
              value={
                usuarioSelecionado.usuario_role == "adm"
                  ? "Administrador"
                  : "Usuário Padrão"
              }
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <div className="flex justify-center gap-2">
            <button
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition
                ${
                  usuarioSelecionado.usuario_ativo == 1
                    ? "bg-red-500/15 border-red-400/30 text-red-300 hover:bg-red-500/25"
                    : "bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25"
                }`}
              title={
                usuarioSelecionado.usuario_ativo == 1 ? "Inativar usuário" : "Ativar usuário"
              }
            >
              <Power size={16} />
              {usuarioSelecionado.usuario_ativo == 1 ? "Inativar usuário" : "Ativar usuário"}
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm hover:bg-white/20 transition"
              title="Resetar senha"
            >
              <RotateCcw size={16} />
              Resetar senha
            </button>

            <button className="inline-flex items-center gap-2 rounded-lg border bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25 px-3 py-1.5 text-sm transition">
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalUsuario;
