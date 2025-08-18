import ModalAumentoGeral from "./ModalAumentoGeral";
import AdicionaCargoModal from "./AdicionaCargoModal";

function ModaisCargos({
  adicionando,
  aumentoGeral,
  setAdicionando,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAumentoGeral,
}) {
  return (
    <div>
      {adicionando && (
        <AdicionaCargoModal
          setAdicionando={setAdicionando}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
        />
      )}

      {aumentoGeral && (
        <ModalAumentoGeral
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
          setAumentoGeral={setAumentoGeral}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
        />
      )}
    </div>
  );
}

export default ModaisCargos;
