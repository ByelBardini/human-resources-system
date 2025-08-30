import ModalAumentoGeral from "./ModalAumentoGeral";
import AdicionaCargoModal from "./AdicionaCargoModal";

function ModaisCargos({
  adicionando,
  aumentoGeral,
  setAdicionando,
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
          setCarregando={setCarregando}
          setModificado={setModificado}
        />
      )}
    </div>
  );
}

export default ModaisCargos;
