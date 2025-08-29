/* eslint-disable react-hooks/exhaustive-deps */
import { X } from "lucide-react";
import { useState } from "react";
import { getSetores } from "../../services/api/setorService.js";
import { putDescricao } from "../../services/api/descricaoService.js";
import { useEffect } from "react";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModificaDescricaoModal({
  setModificaDesc,
  descricao = {
    descricao_id: "",
    cargo: { cargo_nome: "" },
    setor: { setor_id: "", setor_nome: "" },
    descricao_escolaridade: "",
    descricao_treinamento: "",
    descricao_comportamentos: "",
    descricao_tecnicas: "",
    descricao_experiencia: "",
    descricao_responsabilidades: "",
  },
  setCarregando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setModificado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [setores, setSetores] = useState([]);

  const [descId, setDescId] = useState("");
  const [setor, setSetor] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [treinamento, setTreinamento] = useState("");
  const [comportamento, setComportamento] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [responsabilidades, setResponsabilidades] = useState("");

  async function buscaSetores() {
    const id = localStorage.getItem("empresa_id");
    try {
      const setores = await getSetores(id);
      setSetores(setores);
    } catch (err) {
      mostrarAviso("erro", err.message);
      console.error(err);
    }
  }

  function clicaSalvar() {
    setTextoConfirmacao("Tem certeza que deseja salvar esses dados?");
    setOnSimConfirmacao(() => () => salvarDescricao());
    setConfirmacao(true);
  }

  async function salvarDescricao() {
    setConfirmacao(false);
    setCarregando(true);
    try {
      await putDescricao(
        descId,
        setor,
        escolaridade,
        treinamento,
        comportamento,
        tecnico,
        experiencia,
        responsabilidades
      );
      setCarregando(false);
      mostrarAviso("sucesso", "Descrição modificada com sucesso!")
      setModificado(true);
      setTimeout(() => {
        limparAviso;
        setModificaDesc(false);
      }, 500);
      return;
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message);
      console.error(err.message, err);
      return;
    }
  }

  useEffect(() => {
    buscaSetores();

    setDescId(descricao.descricao_id ?? "");
    setSetor(descricao.setor.setor_id ?? "");
    setEscolaridade(descricao.descricao_escolaridade ?? "");
    setTreinamento(descricao.descricao_treinamento ?? "");
    setComportamento(descricao.descricao_comportamentos ?? "");
    setTecnico(descricao.descricao_tecnicas ?? "");
    setExperiencia(descricao.descricao_experiencia ?? "");
    setResponsabilidades(descricao.descricao_responsabilidades ?? "");
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setModificaDesc(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/10 
                      bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-transparent">
          <h2 className="text-white text-lg font-semibold">
            Modificar Descrição
          </h2>
          <button
            onClick={() => setModificaDesc(false)}
            type="button"
            title="Fechar"
            className="cursor-pointer h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[75vh] overflow-auto bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm text-white/70 mb-1">Setor</label>
              <select
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
              >
                <option hidden className="bg-slate-900">
                  {descricao.setor.setor_nome != "" &&
                  descricao.setor.setor_nome != null
                    ? descricao.setor.setor_nome
                    : "Selecione…"}
                </option>
                {setores.map((setor) => (
                  <option value={setor.setor_id} className="bg-slate-900">
                    {setor.setor_nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Função{" "}
              </label>
              <input
                value={descricao.cargo.cargo_nome}
                type="text"
                placeholder="Nome da função"
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Escolaridade
              </label>
              <textarea
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value)}
                rows={4}
                placeholder="Ex.: Ensino médio completo..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-28 md:min-h-32 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Treinamento
              </label>
              <textarea
                value={treinamento}
                onChange={(e) => setTreinamento(e.target.value)}
                rows={4}
                placeholder="Ex.: Participação no treinamento de integração oferecido pela empresa..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-28 md:min-h-32 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Competências Comportamentais
              </label>
              <textarea
                value={comportamento}
                onChange={(e) => setComportamento(e.target.value)}
                rows={5}
                placeholder="Ex.: Comunicação, trabalho em equipe, proatividade, organização..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-32 md:min-h-36 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Competências Técnicas
              </label>
              <textarea
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                rows={5}
                placeholder="Ex.: Pacote Office, técnicas de atendimento ao cliente... "
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-32 md:min-h-36 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Experiência
              </label>
              <textarea
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                rows={4}
                placeholder="Ex.: 2–3 anos na função, vivência com atendimento ao cliente..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-28 md:min-h-32 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Principais responsabilidades
              </label>
              <textarea
                value={responsabilidades}
                onChange={(e) => setResponsabilidades(e.target.value)}
                rows={6}
                placeholder="Ex.: Conduzir reuniões semanais, gerar relatórios, acompanhar indicadores, garantir cumprimento de metas..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 
                           outline-none focus:bg-white/15 resize-y min-h-36 md:min-h-44 whitespace-pre-wrap break-words leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-transparent flex justify-end gap-3">
          <button
            onClick={() => setModificaDesc(false)}
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={clicaSalvar}
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/20 border border-white/10 text-white hover:bg-white/30 shadow"
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModificaDescricaoModal;
