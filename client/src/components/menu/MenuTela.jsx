import HomeMenu from "../telas/HomeMenu.jsx";
import Funcionarios from "../telas/Funcionarios.jsx";
import ManualFuncoes from "../telas/ManualFuncoes.jsx";
import ProjecaoSalarial from "../telas/ProjecaoSalarial.jsx";

function MenuTela({
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
      {opcaoSelecionada == "manualFuncoes" && <ManualFuncoes />}
    </div>
  );
}

export default MenuTela;
