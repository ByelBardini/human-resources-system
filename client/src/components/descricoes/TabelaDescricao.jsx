import { SearchX, Building2, Briefcase, GraduationCap, BookOpen, Users, Wrench, Clock, ClipboardList } from "lucide-react";
import { useState } from "react";

function TabelaDescricao({
  descricoes,
  setDesc,
  setModificaDesc,
}) {
  const [clicado, setClicado] = useState("");

  function selecionaCampo(id) {
    setClicado(clicado === id ? 0 : id);
  }

  function abreModificacao(descricao) {
    const formatada = {
      ...descricao,
      setor:
        descricao?.setor && typeof descricao.setor === "object"
          ? {
              setor_id: descricao.setor?.setor_id ?? "",
              setor_nome: descricao.setor?.setor_nome ?? "",
            }
          : { setor_id: "", setor_nome: "" },
    };
    setDesc(formatada);
    setModificaDesc(true);
  }

  const tabelaVazia = !descricoes || descricoes.length === 0;

  const CelulaComTooltip = ({ children, className = "" }) => (
    <td className={`px-4 py-3.5 ${className}`}>
      <span className="block truncate" title={children || "-"}>
        {children || "-"}
      </span>
    </td>
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <table className="min-w-[1200px] w-full text-sm text-white/90 table-fixed">
        <thead className="bg-white/[0.06] text-white/70 border-b border-white/10">
          <tr>
            <th className="px-4 py-3.5 text-left font-medium w-[120px]">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-white/40" />
                <span>Setor</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[170px]">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-white/40" />
                <span>Função</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[150px]">
              <div className="flex items-center gap-2">
                <GraduationCap size={14} className="text-white/40" />
                <span>Escolaridade</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[150px]">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-white/40" />
                <span>Treinamento</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[180px]">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-white/40" />
                <span>Comp. Comportamentais</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[170px]">
              <div className="flex items-center gap-2">
                <Wrench size={14} className="text-white/40" />
                <span>Comp. Técnicas</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[150px]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/40" />
                <span>Experiência</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-left font-medium w-[180px]">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-white/40" />
                <span>Responsabilidades</span>
              </div>
            </th>
          </tr>
        </thead>
        {!tabelaVazia ? (
          <tbody>
            {descricoes.map((descricao, index) => (
              <tr
                key={descricao.descricao_id}
                className={`
                  border-b border-white/5 cursor-pointer transition-all duration-150
                  ${clicado === descricao.descricao_id
                    ? "bg-white/10"
                    : "hover:bg-white/[0.04]"
                  }
                `}
                onClick={() => selecionaCampo(descricao.descricao_id)}
                onDoubleClick={() => abreModificacao(descricao)}
              >
                <CelulaComTooltip>{descricao.setor?.setor_nome}</CelulaComTooltip>
                <CelulaComTooltip className="font-medium text-white/95">{descricao.cargo?.cargo_nome}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_escolaridade}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_treinamento}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_comportamentos}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_tecnicas}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_experiencia}</CelulaComTooltip>
                <CelulaComTooltip>{descricao.descricao_responsabilidades}</CelulaComTooltip>
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td colSpan={8} className="px-6 py-16 text-center">
                <div className="inline-flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-white/60">
                  <SearchX size={20} className="opacity-70" />
                  <span>Nenhuma descrição encontrada</span>
                </div>
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}

export default TabelaDescricao;
