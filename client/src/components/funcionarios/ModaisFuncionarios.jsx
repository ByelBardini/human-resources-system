import AdicionaFuncionarioModal from "./AdicionaFuncionarioModal";

function ModaisFuncionarios({
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
    </div>
  );
}

export default ModaisFuncionarios;
