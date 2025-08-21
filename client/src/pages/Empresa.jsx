import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Background from "../components/default/Background.jsx";
import Loading from "../components/default/Loading.jsx";
import ModalAviso from "../components/default/ModalAviso.jsx";
import MenuOpcoes from "../components/menu/MenuOpcoes.jsx";
import MenuTela from "../components/menu/MenuTela.jsx";
import ModaisCargos from "../components/cargos/ModaisCargos.jsx";
import ModaisFuncionarios from "../components/funcionarios/ModaisFuncionarios.jsx";
import ModalConfirmacao from "../components/default/ModalConfirmacao.jsx";
import ModificaDescricaoModal from "../components/descricoes/ModificaDescricaoModal.jsx";

function Empresa() {
  const navigate = useNavigate();

  const [adicionandoCargo, setAdicionandoCargo] = useState(false);
  const [aumentoGeral, setAumentoGeral] = useState(false);

  const [adicionandoFunc, setAdicionandoFunc] = useState(false);
  const [cardFuncionario, setCardFuncionario] = useState(false);

  const [modificaDesc, setModificaDesc] = useState(false);
  const [desc, setDesc] = useState();

  const [carregando, setCarregando] = useState(false);

  const [aviso, setAviso] = useState(false);
  const [corAviso, setCorAviso] = useState("");
  const [textoAviso, setTextoAviso] = useState("");

  const [confirmacao, setConfirmacao] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [onSimConfirmacao, setOnSimConfirmacao] = useState("");

  const aba_inicial = localStorage.getItem("aba_inicial") || "home";
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(aba_inicial);

  useEffect(() => {
    document.title = `Empresa - Sistema RH`;
  }, []);

  function voltar() {
    localStorage.setItem("aba_inicial", null);
    navigate("/home", { replace: true });
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center p-6 overflow-hidden">
      <Background />

      {modificaDesc && (
        <ModificaDescricaoModal
          setModificaDesc={setModificaDesc}
          descricao={desc}
          setAviso={setAviso}
          setCorAviso={setCorAviso}
          setTextoAviso={setTextoAviso}
          setCarregando={setCarregando}
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
        />
      )}

      <ModaisCargos
        adicionando={adicionandoCargo}
        aumentoGeral={aumentoGeral}
        setAdicionando={setAdicionandoCargo}
        setAviso={setAviso}
        setCorAviso={setCorAviso}
        setTextoAviso={setTextoAviso}
        setCarregando={setCarregando}
        setConfirmacao={setConfirmacao}
        setTextoConfirmacao={setTextoConfirmacao}
        setOnSimConfirmacao={setOnSimConfirmacao}
        setAumentoGeral={setAumentoGeral}
      />

      <ModaisFuncionarios
        setCard={setCardFuncionario}
        card={cardFuncionario}
        adicionandoFunc={adicionandoFunc}
        setAdicionandoFunc={setAdicionandoFunc}
        setAviso={setAviso}
        setCorAviso={setCorAviso}
        setTextoAviso={setTextoAviso}
        setCarregando={setCarregando}
      />

      {confirmacao && (
        <ModalConfirmacao
          texto={textoConfirmacao}
          onClickSim={onSimConfirmacao}
          onClickNao={() => setConfirmacao(false)}
        />
      )}

      {aviso && (
        <ModalAviso
          texto={textoAviso}
          cor={corAviso}
          onClick={() => setAviso(false)}
        />
      )}

      {carregando && <Loading />}

      <button
        className="cursor-pointer absolute top-6 left-6 p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg z-10"
        title="Sair"
        onClick={voltar}
      >
        <Undo2 size={20} />
      </button>

      <div className="overflow-x-hidden overflow-y-hidden text-white flex flex-col gap-5 items-center justify-center">
        <div className="min-w-300 min-h-20 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <MenuOpcoes
            setOpcaoSelecionada={setOpcaoSelecionada}
            opcaoSelecionada={opcaoSelecionada}
          />
        </div>
        <div className="overflow-y-auto min-w-300 min-h-140 max-h-140 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          <MenuTela
            setCardFuncionario={setCardFuncionario}
            opcaoSelecionada={opcaoSelecionada}
            setCarregando={setCarregando}
            setAviso={setAviso}
            setCorAviso={setCorAviso}
            setTextoAviso={setTextoAviso}
            setAdicionando={setAdicionandoCargo}
            setConfirmacao={setConfirmacao}
            setTextoConfirmacao={setTextoConfirmacao}
            setOnSimConfirmacao={setOnSimConfirmacao}
            setAumentoGeral={setAumentoGeral}
            setAdicionandoFunc={setAdicionandoFunc}
            setDesc={setDesc}
            setModificaDesc={setModificaDesc}
          />
        </div>
      </div>
    </div>
  );
}

export default Empresa;
