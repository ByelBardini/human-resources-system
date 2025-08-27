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
}) {
  return (
    <div>
      {adicionando && (
        <AdicionaCargoModal
          setAdicionando={setAdicionando}
          setCarregando={setCarregando}
        />
      )}

      {aumentoGeral && (
        <ModalAumentoGeral
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
          setAumentoGeral={setAumentoGeral}
          setCarregando={setCarregando}
        />
      )}
    </div>
  );
}

export default ModaisCargos;
