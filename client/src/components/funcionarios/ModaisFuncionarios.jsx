import AdicionaFuncionarioModal from "./AdicionaFuncionarioModal";
import CardFuncionario from ".//CardFuncionario.jsx";

function ModaisFuncionarios({
  setCard,
  card,
  adicionandoFunc,
  setAdicionandoFunc,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
}) {
  return (
    <div>
      {adicionandoFunc && (
        <AdicionaFuncionarioModal
          setAdicionandoFunc={setAdicionandoFunc}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
        />
      )}
      {card && <CardFuncionario setCard={setCard} />}
    </div>
  );
}

export default ModaisFuncionarios;
