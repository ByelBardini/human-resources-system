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
  setModificado,
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
          setModificado={setModificado}
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
          setModificado={setModificado}
        />
      )}
    </div>
  );
}

export default ModaisCargos;
