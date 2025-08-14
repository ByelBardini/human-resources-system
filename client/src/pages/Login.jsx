/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import logoEmpresa from "../assets/logo-empresa.png";

function Login() {
  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-0 -left-0 w-[550px] h-screen bg-gradient-to-r from-black to-blue-950" />
        <div className="absolute -top-0 -right-[550px] w-full h-screen bg-gradient-to-r from-blue-950 to-blue-700" />
        <div className="absolute top-0 right-0 w-[800px] h-full flex justify-center items-center p-6">
          <div className="relative w-[550px] h-[550px] flex justify-center items-center">
            <div className="absolute inset-0 rounded-full bg-blue-500 blur-3xl animate-pulse"></div>
            <motion.img
              src={logoEmpresa}
              alt="Logo da Empresa"
              initial={{ scale: 1, rotate: 0 }}
              animate={{
                scale: [1, 1.04, 1, 0.96, 1],
                rotate: [0, 3, 0, -3, 0],
              }}
              transition={{
                duration: 10,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror", 
              }}
              className="relative z-10 transform-gpu"
            />
          </div>
        </div>
      </div>
      <div className="absolute -top-0 -left-0 w-[550px] h-screen flex justify-center items-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <h1 className="text-2xl font-semibold text-white mb-1 text-center">
            Entrar
          </h1>
          <p className="text-sm text-white/70 mb-6 text-center">
            Acesse o sistema de RH
          </p>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="login"
                className="block text-sm text-white/80 mb-1"
              >
                Login
              </label>
              <input
                id="login"
                name="login"
                type="text"
                placeholder="Seu usuário"
                className="w-full rounded-xl bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm text-white/80 mb-1"
              >
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
              />
            </div>

            <button
              type="button"
              className="cursor-pointer w-full rounded-xl bg-blue-600 text-white font-medium py-3 hover:bg-blue-500 active:bg-blue-700 transition shadow-lg shadow-blue-900/30"
            >
              Entrar
            </button>
          </form>
          <p className="text-sm text-white/70 mt-4 text-center">
            Entre em contato com o setor de TI para conseguir seu login
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
