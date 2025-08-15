/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { getEmpresaImagem } from "../../services/api/empresasService.js";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function HomeMenu({ setCarregando, setAviso, setCorAviso, setTextoAviso }) {
  const [imagem, setImagem] = useState(null);
  const [cor, setCor] = useState("blue");

  async function buscarImagemEmpresa() {
    setCarregando(true);

    setCor(localStorage.getItem("empresa_cor"));
    const id = localStorage.getItem("empresa_id");
    try {
      const imagem = await getEmpresaImagem(id);
      setImagem(imagem);
    } catch (err) {
      setAviso(true);
      setCorAviso("vermelho");
      setTextoAviso("Erro ao buscar imagem da empresa.");
      console.error("Erro ao buscar imagem da empresa:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarImagemEmpresa();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Menu Principal</h1>
      <div className="relative flex justify-center items-center">
        <div
          className={`absolute top-18 w-75 h-75 rounded-full bg-${cor}-500 blur-3xl animate-pulse`}
        ></div>
        <motion.img
          src={imagem}
          alt="Logo da Empresa"
          initial={{ scale: 1, rotate: 0 }}
          animate={{
            scale: [1, 1.04, 1, 0.96, 1],
          }}
          transition={{
            duration: 10,
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className="relative z-10 transform-gpu max-w-100 max-h-100"
        />
      </div>
    </div>
  );
}

export default HomeMenu;
