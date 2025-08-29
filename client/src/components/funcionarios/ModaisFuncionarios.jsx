import AdicionaFuncionarioModal from "./AdicionaFuncionarioModal";
import CardFuncionario from "./CardFuncionario.jsx";
import ModalCriaNotificacao from "../notificacoes/ModalCriaNotificacao.jsx";
import ModalModificaFuncionario from "./ModalModificaFuncionario.jsx";
import ModalInativa from "./ModalInativa.jsx";
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
  const [inativando, setInativando] = useState(false);

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
          setModificado={setModificado}
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
          setCarregando={setCarregando}
          setInativando={setInativando}
        />
      )}

      {inativando && (
        <ModalInativa
          setInativando={setInativando}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
          setCard={setCard}
          setAdicionado={setAdicionado}
        />
      )}
    </div>
  );
}

export default ModaisFuncionarios;
