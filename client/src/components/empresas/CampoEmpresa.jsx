/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";

export default function CampoEmpresa({ empresas = [], navigate }) {
  async function escolherEmpresa(empresa) {
    localStorage.setItem("empresa_id", empresa.empresa_id);
    localStorage.setItem("empresa_nome", empresa.empresa_nome);
    localStorage.setItem("empresa_cor", empresa.empresa_cor);
    localStorage.setItem("aba_inicial", "home");
    navigate("/empresa", { replace: true });
  }

  return (
    <div className="w-full">
      {empresas.map((empresa) => {
        const cor = empresa.empresa_cor || "black";
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
              className="pointer-events-none absolute -inset-3 rounded-2xl blur-2xl opacity-40 group-hover:opacity-40 transition-opacity duration-300"
              style={{
                background: `linear-gradient(to bottom, ${cor}, ${cor}40)`,
              }}
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
              style={{
                background: `linear-gradient(to bottom, ${cor}, ${cor}aa)`,
              }}
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
              style={{
                background: cor,
              }}
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
