/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { logar } from "../services/auth/authService.js";
import logoEmpresa from "../assets/logo-empresa.png";
import Loading from "../components/default/Loading.jsx";
import { useAviso } from "../context/AvisoContext.jsx";

function Login() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    document.title = "Login - Sistema RH";
  }, []);

  useEffect(() => {
    if (localStorage.getItem("sessaoInvalida")) {
      mostrarAviso("erro", "Sessão inválida, realize o login novamente", true);
      localStorage.removeItem("sessaoInvalida");
    }
  }, []);

  async function logarSistema() {
    setCarregando(true);
    try {
      const {
        token,
        usuario_nome,
        usuario_troca_senha,
        usuario_cargo_id,
        cargo_nome,
        permissoes,
        empresas,
        usuario_id,
      } = await logar(login, senha);

      localStorage.setItem("token", token);
      localStorage.setItem("usuario_nome", usuario_nome);
      localStorage.setItem("usuario_id", usuario_id);
      localStorage.setItem("usuario_cargo_id", usuario_cargo_id);
      localStorage.setItem("cargo_nome", cargo_nome);
      localStorage.setItem("permissoes", JSON.stringify(permissoes));
      localStorage.setItem("empresas", JSON.stringify(empresas || []));
      localStorage.setItem("usuario_troca_senha", usuario_troca_senha);

      setCarregando(false);
      mostrarAviso("sucesso", "Login realizado com sucesso!");

      setTimeout(() => {
        limparAviso();
        // Redirecionar usuários básicos para a página de ponto
        if (cargo_nome === "Usuário Básico") {
          navigate("/ponto", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 500);
    } catch (err) {
      if (err.message.includes("obrigatórios")) {
        mostrarAviso("erro", "Você precisa preencher todos os campos", true);
      } else if (err.message.includes("Login incorreto")) {
        mostrarAviso("erro", "Usuário não encontrado", true);
      } else if (err.message.includes("Usuário inativo")) {
        mostrarAviso(
          "erro",
          "Usuário inativo, fale com um responsável do setor",
          true
        );
      } else if (err.message.includes("Senha incorreta")) {
        mostrarAviso("erro", "Senha incorreta, verifique novamente", true);
      } else {
        mostrarAviso("erro", err.message, true);
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      {/* Background - gradientes mantidos */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-blue-950 to-blue-700" />

      {/* Blur orbs - cores em movimento */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute left-[10%] bottom-[20%] w-80 h-80 rounded-full bg-red-500 blur-3xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute right-[15%] bottom-[25%] w-64 h-80 rounded-full bg-orange-500 blur-3xl"
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 25, -35, 0],
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute right-[30%] top-[15%] w-96 h-32 rounded-full bg-blue-100 blur-3xl"
          animate={{
            x: [0, 60, -40, 0],
            y: [0, 40, -20, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {carregando && <Loading />}

      {/* Card central - layout unificado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center"
      >
        {/* Logo com animação mantida */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
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
            className="w-32 h-auto drop-shadow-2xl"
          />
        </motion.div>

        {/* Formulário */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6">
          <h1 className="text-xl font-semibold text-white text-center mb-1">
            Entrar
          </h1>
          <p className="text-sm text-white/70 text-center mb-6">
            Acesse o sistema de RH
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              logarSistema();
            }}
          >
            <div>
              <label htmlFor="login" className="block text-sm text-white/80 mb-1">
                Login
              </label>
              <input
                id="login"
                name="login"
                type="text"
                placeholder="Seu usuário"
                className="w-full rounded-lg bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm text-white/80 mb-1">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg bg-white/90 text-slate-900 placeholder-slate-500 px-4 py-3 outline-none border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition"
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-500 active:bg-blue-700 transition shadow-lg shadow-blue-900/30"
            >
              Entrar
            </button>
          </form>

          <p className="text-xs text-white/70 mt-4 text-center">
            Entre em contato com o setor de TI para conseguir seu login
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
