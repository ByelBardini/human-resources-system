import HomeMenu from "../telas/HomeMenu.jsx";
import DistribuicaoSalarial from "../telas/DistribuicaoSalarial.jsx";
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
      {opcaoSelecionada == "distribuicaoSalarial" && <DistribuicaoSalarial />}
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
        />
      )}
      {opcaoSelecionada == "manualFuncoes" && <ManualFuncoes />}
    </div>
  );
}

export default MenuTela;
