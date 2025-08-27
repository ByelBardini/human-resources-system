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
          setCarregando={setCarregando}
          setModificado={setModificado}
        />
      )}

      {notificacao && (
        <ModalCriaNotificacao
          setNotificacao={setNotificacao}
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
          setCarregando={setCarregando}
        />
      )}

      {card && (
        <CardFuncionario
          setCard={setCard}
          setNotificacao={setNotificacao}
          adicionado={adicionado}
          setAdicionado={setAdicionado}
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
          setCarregando={setCarregando}
          setCard={setCard}
          setAdicionado={setAdicionado}
        />
      )}
    </div>
  );
}

export default ModaisFuncionarios;
