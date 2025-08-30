// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { CircleAlert, CircleX, CircleCheckBig } from "lucide-react";

function ModalAviso({
  texto = "Aviso",
  cor = "vermelho",
  onClick,
  showButton = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[500] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-blue-950/50 backdrop-blur-xl" />

      <motion.div
        initial={{ y: 28, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 28, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, type: "spring", bounce: 0.14 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6"
      >
        <div
          className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b ${
            cor === "amarelo"
              ? "from-amber-300/30"
              : cor === "vermelho"
              ? "from-red-300/30"
              : "from-emerald-300/30"
          } via-transparent to-transparent opacity-60`}
        />

        <div className="flex items-center justify-center mb-4">
          {cor === "amarelo" ? (
            <CircleAlert className="text-white" size={36} />
          ) : cor === "vermelho" ? (
            <CircleX className="text-white" size={36} />
          ) : (
            <CircleCheckBig className="text-white" size={36} />
          )}
        </div>

        <h2 className="text-center text-white text-xl font-semibold mb-2">
          {texto}
        </h2>

        {showButton && ( // 👈 só mostra quando você mandar
          <div className="flex items-center justify-center gap-3">
            <button
              className={`cursor-pointer rounded-xl ${
                cor === "amarelo"
                  ? "bg-amber-300 shadow-amber-900/30 hover:bg-amber-500 active:bg-amber-700 transition"
                  : cor === "vermelho"
                  ? "bg-red-600 shadow-red-900/30 hover:bg-red-500 active:bg-red-700 transition"
                  : "bg-emerald-300 shadow-emerald-900/30 hover:bg-emerald-500 active:bg-emerald-700 transition"
              } text-white font-medium py-2.5 px-8 shadow-lg`}
              onClick={onClick}
              autoFocus
            >
              OK
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ModalAviso;
