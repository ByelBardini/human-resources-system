/* eslint-disable react-hooks/exhaustive-deps */
import { X, FileText, Building2, Briefcase, GraduationCap, BookOpen, Users, Wrench, Clock, ClipboardList } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSetores } from "../../services/api/setorService.js";
import { putDescricao } from "../../services/api/descricaoService.js";
import CustomSelect from "../default/CustomSelect.jsx";
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
      mostrarAviso("erro", err.message, true);
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
      mostrarAviso("sucesso", "Descrição modificada com sucesso!", true)
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        setModificaDesc(false);
      }, 500);
      return;
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
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
      className="fixed inset-0 z-150 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setModificaDesc(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/10 
                      bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold">Modificar Descrição</h2>
              <p className="text-xs text-white/50">Edite os detalhes da descrição de cargo</p>
            </div>
          </div>
          <button
            onClick={() => setModificaDesc(false)}
            type="button"
            title="Fechar"
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* Setor e Função */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <Building2 size={14} className="text-white/50" />
                Setor
              </label>
              <CustomSelect value={setor} onChange={(e) => setSetor(e.target.value)}>
                <option hidden value="">Selecione…</option>
                {setores.map((s) => (
                  <option key={s.setor_id} value={s.setor_id}>{s.setor_nome}</option>
                ))}
              </CustomSelect>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <Briefcase size={14} className="text-white/50" />
                Função
              </label>
              <input
                value={descricao.cargo.cargo_nome}
                type="text"
                placeholder="Nome da função"
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/70 placeholder-white/40 
                           outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Grid 2 colunas para os campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <GraduationCap size={14} className="text-white/50" />
                Escolaridade
              </label>
              <textarea
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value)}
                rows={3}
                placeholder="Ex.: Ensino médio completo..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <BookOpen size={14} className="text-white/50" />
                Treinamento
              </label>
              <textarea
                value={treinamento}
                onChange={(e) => setTreinamento(e.target.value)}
                rows={3}
                placeholder="Ex.: Treinamento de integração..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <Users size={14} className="text-white/50" />
                Competências Comportamentais
              </label>
              <textarea
                value={comportamento}
                onChange={(e) => setComportamento(e.target.value)}
                rows={3}
                placeholder="Ex.: Comunicação, trabalho em equipe..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <Wrench size={14} className="text-white/50" />
                Competências Técnicas
              </label>
              <textarea
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                rows={3}
                placeholder="Ex.: Pacote Office, atendimento..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <Clock size={14} className="text-white/50" />
                Experiência
              </label>
              <textarea
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                rows={3}
                placeholder="Ex.: 2–3 anos na função..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-2">
                <ClipboardList size={14} className="text-white/50" />
                Principais Responsabilidades
              </label>
              <textarea
                value={responsabilidades}
                onChange={(e) => setResponsabilidades(e.target.value)}
                rows={3}
                placeholder="Ex.: Conduzir reuniões, gerar relatórios..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/90 placeholder-white/40 
                           outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            onClick={() => setModificaDesc(false)}
            type="button"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={clicaSalvar}
            type="button"
            className="px-4 py-2 rounded-lg bg-white/15 border border-white/10 text-white hover:bg-white/20 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(ModificaDescricaoModal);
