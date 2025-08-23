import HomeMenu from "../telas/HomeMenu.jsx";
import Funcionarios from "../telas/Funcionarios.jsx";
import ManualFuncoes from "../telas/ManualFuncoes.jsx";
import ProjecaoSalarial from "../telas/ProjecaoSalarial.jsx";

function MenuTela({
  setCardFuncionario,
  opcaoSelecionada,
  setCarregando,
  setAviso,
  setCorAviso,
  setTextoAviso,
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
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {opcaoSelecionada == "home" && (
        <HomeMenu
          setCarregando={setCarregando}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
        />
      )}
      {opcaoSelecionada == "funcionarios" && (
        <Funcionarios
          setAdicionandoFunc={setAdicionandoFunc}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCardFuncionario={setCardFuncionario}
          setModificado={setModificado}
          modificado={modificado}
        />
      )}
      {opcaoSelecionada == "projecaoSalarial" && (
        <ProjecaoSalarial
          setAdicionando={setAdicionando}
          cargoCriado={cargoCriado}
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setAumentoGeral={setAumentoGeral}
          setCarregando={setCarregando}
        />
      )}
      {opcaoSelecionada == "manualFuncoes" && (
        <ManualFuncoes setDesc={setDesc} setModificaDesc={setModificaDesc} />
      )}
    </div>
  );
}

export default MenuTela;
