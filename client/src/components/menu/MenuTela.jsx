import { useEffect, useState } from "react";
import HomeMenu from "../telas/HomeMenu.jsx";
import Funcionarios from "../telas/Funcionarios.jsx";
import ManualFuncoes from "../telas/ManualFuncoes.jsx";
import ProjecaoSalarial from "../telas/ProjecaoSalarial.jsx";

function MenuTela({
  setCardFuncionario,
  opcaoSelecionada,
  setCarregando,
  setAdicionando,
  cargoCriado,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAumentoGeral,
  setAdicionandoFunc,
  setDesc,
  setModificaDesc,
  modificado,
  setModificado,
  navigate,
}) {
  const [abaAtual, setAbaAtual] = useState(opcaoSelecionada);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(false);

    const timeout = setTimeout(() => {
      setAbaAtual(opcaoSelecionada);
      setFadeIn(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [opcaoSelecionada]);

  function renderConteudo() {
    switch (abaAtual) {
      case "home":
        return <HomeMenu setCarregando={setCarregando} navigate={navigate} />;
      case "funcionarios":
        return (
          <Funcionarios
            setAdicionandoFunc={setAdicionandoFunc}
            setCardFuncionario={setCardFuncionario}
            setModificado={setModificado}
            modificado={modificado}
            navigate={navigate}
          />
        );
      case "projecaoSalarial":
        return (
          <ProjecaoSalarial
            setAdicionando={setAdicionando}
            cargoCriado={cargoCriado}
            setConfirmacao={setConfirmacao}
            setTextoConfirmacao={setTextoConfirmacao}
            setOnSimConfirmacao={setOnSimConfirmacao}
            setAumentoGeral={setAumentoGeral}
            setCarregando={setCarregando}
            navigate={navigate}
            setModificado={setModificado}
            modificado={modificado}
          />
        );
      case "manualFuncoes":
        return (
          <ManualFuncoes
            setDesc={setDesc}
            setModificaDesc={setModificaDesc}
            navigate={navigate}
            setModificado={setModificado}
            modificado={modificado}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="relative w-full h-full min-h-[200px]">
      <div
        className={`w-full h-full transition-all duration-1000 ease-in-out
          ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {renderConteudo()}
      </div>
    </div>
  );
}

export default MenuTela;
