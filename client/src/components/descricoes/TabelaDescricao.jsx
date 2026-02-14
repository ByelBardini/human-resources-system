import { SearchX } from "lucide-react";
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

  return (
    <div className="mt-5 relative w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
      <table className="min-w-[1200px] w-full text-sm text-white/90 table-fixed">
        <thead className="bg-white/10 text-white/80 sticky top-0 z-20">
          <tr className="divide-x divide-white/10">
            <th className="px-4 py-3 text-left font-medium w-[135px]">Setor</th>
            <th className="px-4 py-3 text-left font-medium w-[190px]">Função</th>
            <th className="px-4 py-3 text-left font-medium w-[150px]">Escolaridade</th>
            <th className="px-4 py-3 text-left font-medium w-[150px]">Treinamento</th>
            <th className="px-4 py-3 text-left font-medium w-[180px]">
              Competências Comportamentais
            </th>
            <th className="px-4 py-3 text-left font-medium w-[180px]">
              Competências Técnicas
            </th>
            <th className="px-4 py-3 text-left font-medium w-[150px]">Experiência</th>
            <th className="px-4 py-3 text-left font-medium w-[190px]">
              Principais responsabilidades
            </th>
          </tr>
        </thead>
        {!tabelaVazia ? (
          <tbody className="divide-y divide-white/10">
            {descricoes.map((descricao) => (
              <tr
                key={descricao.descricao_id}
                className={
                  clicado === descricao.descricao_id
                    ? "bg-white/8 hover:bg-white/12 transition-colors"
                    : "hover:bg-white/3 transition-colors"
                }
                onClick={() => selecionaCampo(descricao.descricao_id)}
                onDoubleClick={() => abreModificacao(descricao)}
              >
                <td className="px-4 py-3 truncate">{descricao.setor?.setor_nome || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.cargo?.cargo_nome || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_escolaridade || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_treinamento || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_comportamentos || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_tecnicas || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_experiencia || "-"}</td>
                <td className="px-4 py-3 truncate">{descricao.descricao_responsabilidades || "-"}</td>
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td colSpan={8} className="px-6 py-10 text-center">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
                  <SearchX size={16} className="opacity-80" />
                  Nenhuma função encontrada
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
