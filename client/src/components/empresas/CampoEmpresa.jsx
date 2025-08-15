/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";

export default function CampoEmpresa({ empresas = [], navigate }) {
  async function escolherEmpresa(empresa) {
    localStorage.setItem("empresa_id", empresa.empresa_id);
    localStorage.setItem("empresa_nome", empresa.empresa_nome);
    localStorage.setItem("empresa_cor", empresa.empresa_cor);
    navigate("/empresa", { replace: true });
  }

  return (
    <div className="w-full">
      {empresas.map((empresa) => {
        return (
          <motion.button
            key={empresa.empresa_id}
            layout
            whileHover={{ scale: 1.015, y: -1 }}
            onClick={() => escolherEmpresa(empresa)}
            className={[
              "cursor-pointer group relative w-full overflow-hidden rounded-2xl px-5 py-4 my-3",
              "bg-white/5 border border-white/10 backdrop-blur",
              "flex items-center justify-between text-slate-100",
              "shadow-lg transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-3 rounded-2xl blur-2xl from-blue-500 to-bg-${empresa.empresa_cor}--500/30-300 opacity-40 group-hover:opacity-40 transition-opacity duration-300`}
            />

            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-${empresa.empresa_cor}-500 to-${empresa.empresa_cor}-300`}
            />

            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-${empresa.empresa_cor}-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out`}
            />

            <span className="relative z-[1] text-base md:text-lg font-semibold tracking-tight">
              {empresa.empresa_nome}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
