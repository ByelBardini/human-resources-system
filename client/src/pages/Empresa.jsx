import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Background from "../components/default/Background.jsx";
import Loading from "../components/default/Loading.jsx";
import ModalConfirmacao from "../components/default/ModalConfirmacao.jsx";
import Header from "../components/menu/Header.jsx";
import MenuTela from "../components/menu/MenuTela.jsx";
import ModaisCargos from "../components/cargos/ModaisCargos.jsx";
import ModaisFuncionarios from "../components/funcionarios/ModaisFuncionarios.jsx";
import ModificaDescricaoModal from "../components/descricoes/ModificaDescricaoModal.jsx";

function Empresa() {
  const navigate = useNavigate();

  const [adicionandoCargo, setAdicionandoCargo] = useState(false);
  const [aumentoGeral, setAumentoGeral] = useState(false);
  const [adicionandoFunc, setAdicionandoFunc] = useState(false);
  const [cardFuncionario, setCardFuncionario] = useState(false);
  const [emitirNotificacao, setEmitirNotificacao] = useState(false);
  const [modificaFuncionario, setModificaFuncionario] = useState(false);
  const [modificado, setModificado] = useState(false);
  const [modificaDesc, setModificaDesc] = useState(false);
  const [desc, setDesc] = useState();
  const [carregando, setCarregando] = useState(false);
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

      {/* Modal editar descrição */}
      {modificaDesc && (
        <ModificaDescricaoModal
          setModificaDesc={setModificaDesc}
          descricao={desc}
          setCarregando={setCarregando}
          setConfirmacao={setConfirmacao}
          setTextoConfirmacao={setTextoConfirmacao}
          setOnSimConfirmacao={setOnSimConfirmacao}
          setModificado={setModificado}
        />
      )}

      {/* Modais de cargos */}
      <ModaisCargos
        adicionando={adicionandoCargo}
        aumentoGeral={aumentoGeral}
        setAdicionando={setAdicionandoCargo}
        setCarregando={setCarregando}
        setConfirmacao={setConfirmacao}
        setTextoConfirmacao={setTextoConfirmacao}
        setOnSimConfirmacao={setOnSimConfirmacao}
        setAumentoGeral={setAumentoGeral}
        setModificado={setModificado}
      />

      {/* Modais de funcionários */}
      <ModaisFuncionarios
        setCard={setCardFuncionario}
        card={cardFuncionario}
        adicionandoFunc={adicionandoFunc}
        setAdicionandoFunc={setAdicionandoFunc}
        setCarregando={setCarregando}
        setNotificacao={setEmitirNotificacao}
        notificacao={emitirNotificacao}
        setConfirmacao={setConfirmacao}
        setTextoConfirmacao={setTextoConfirmacao}
        setOnSimConfirmacao={setOnSimConfirmacao}
        modificaFuncionario={modificaFuncionario}
        setModificaFuncionario={setModificaFuncionario}
        setModificado={setModificado}
        modificado={modificado}
      />

      {/* Confirmação */}
      {confirmacao && (
        <ModalConfirmacao
          texto={textoConfirmacao}
          onClickSim={onSimConfirmacao}
          onClickNao={() => setConfirmacao(false)}
        />
      )}

      {/* Carregando */}
      {carregando && <Loading />}

      {/* Header */}
      <Header
        opcaoSelecionada={opcaoSelecionada}
        setOpcaoSelecionada={setOpcaoSelecionada}
        onSair={voltar}
      />

      {/* Conteúdo principal */}
      <main
        className={`flex-1 w-full pt-24 flex justify-center transition-all ${
          opcaoSelecionada === "home" ? "items-start" : "items-start"
        }`}
      >
        <div
          className={`w-full transition-all ${
            opcaoSelecionada === "home"
              ? "w-full h-[500px] overflow-visible"
              : "max-w-[98%] xl:max-w-[98%] 2xl:max-w-[99%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl overflow-y-auto"
          } px-6 py-6`}
        >
          <MenuTela
            setCardFuncionario={setCardFuncionario}
            opcaoSelecionada={opcaoSelecionada}
            setCarregando={setCarregando}
            setAdicionando={setAdicionandoCargo}
            setConfirmacao={setConfirmacao}
            setTextoConfirmacao={setTextoConfirmacao}
            setOnSimConfirmacao={setOnSimConfirmacao}
            setAumentoGeral={setAumentoGeral}
            setAdicionandoFunc={setAdicionandoFunc}
            setDesc={setDesc}
            setModificaDesc={setModificaDesc}
            setModificado={setModificado}
            modificado={modificado}
            navigate={navigate}
          />
        </div>
      </main>
    </div>
  );
}

export default Empresa;
