import AdicionaFuncionarioModal from "./AdicionaFuncionarioModal";
import CardFuncionario from "./CardFuncionario.jsx";
import ModalCriaNotificacao from "../notificacoes/ModalCriaNotificacao.jsx";
import ModalModificaFuncionario from "./ModalModificaFuncionario.jsx";
import { useState } from "react";

function ModaisFuncionarios({
  setCard,
  card,
  adicionandoFunc,
  setAdicionandoFunc,
  setAviso,
  setCorAviso,
  setTextoAviso,
  setCarregando,
  setNotificacao,
  notificacao,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setModificaFuncionario,
  modificaFuncionario,
  modificado,
  setModificado,
}) {
  const [adicionado, setAdicionado] = useState(false);
  return (
    <div>
      {modificaFuncionario && (
        <ModalModificaFuncionario
          setModifica={setModificaFuncionario}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
          setModificado={setModificado}
        />
      )}

      {notificacao && (
        <ModalCriaNotificacao
          setNotificacao={setNotificacao}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
          setAdicionado={setAdicionado}
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
        />
      )}

      {adicionandoFunc && (
        <AdicionaFuncionarioModal
          setAdicionandoFunc={setAdicionandoFunc}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
        />
      )}
      {card && (
        <CardFuncionario
          setCard={setCard}
          setNotificacao={setNotificacao}
          adicionado={adicionado}
          setAdicionado={setAdicionado}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setModifica={setModificaFuncionario}
          setModificado={setModificado}
          modificado={modificado}
        />
      )}
    </div>
  );
}

export default ModaisFuncionarios;
