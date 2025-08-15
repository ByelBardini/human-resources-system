/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div
      className="fixed inset-0 grid place-items-center z-999"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-blue-950/50 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center transform-gpu">
        <motion.div
          className="absolute -inset-6 rounded-full bg-blue-500/25 blur-2xl"
          animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />

        <span className="block h-12 w-12 rounded-full border-2 border-white/20 border-t-white/90 animate-spin" />
        <motion.p
          className="mt-4 text-xs font-medium text-white/80"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Carregando…
        </motion.p>
      </div>
    </motion.div>
  );
}