import { Trash2, SquarePen, Check } from "lucide-react";
function IconeBotao({ onClick, tipo }) {
  const base =
    "inline-flex items-center justify-center h-9 w-9 rounded-xl border backdrop-blur-md transition-all shadow " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";
  const tipos = {
    editar: "bg-white/10 border-white/10 text-white hover:bg-white/20",
    deletar:
      "bg-red-500/10 border-red-400/20 text-red-200 hover:bg-red-500/20 hover:border-red-400",
    confirmar:
      "bg-green-500/10 border-green-400/20 text-green-200 hover:bg-green-500/20 hover:border-green-400",
  };
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${base} ${tipos[tipo]}`}
    >
      {tipo === "editar" && (
        <SquarePen
          size={18}
          strokeWidth={1.8}
          className="pointer-events-none"
        />
      )}
      {tipo === "deletar" && (
        <Trash2 size={18} strokeWidth={1.8} className="pointer-events-none" />
      )}
      {tipo === "confirmar" && (
        <Check size={18} strokeWidth={1.8} className="pointer-events-none" />
      )}
    </button>
  );
}

export default IconeBotao;
