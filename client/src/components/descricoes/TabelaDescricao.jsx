/* eslint-disable react-hooks/exhaustive-deps */
import { SearchX } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";

function TabelaDescricao({
  descricoes,
  setDesc,
  setModificaDesc,
  descricoesFiltradas,
  setorFiltro,
  cargoFiltro,
}) {
  const [tabelaVazia, setTabelaVazia] = useState(false);
  const [clicado, setClicado] = useState("");
  const [listaDescricoes, setListaDescricoes] = useState([]);

  function selecionaCampo(id) {
    if (clicado == id) {
      setClicado(0);
    } else {
      setClicado(id);
    }
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

  function setarFiltro() {
    if (descricoesFiltradas.length > 0) {
      setListaDescricoes(descricoesFiltradas);
      setTabelaVazia(false);
      return;
    }
    if (
      setorFiltro.length > 0 ||
      cargoFiltro.length > 0 ||
      descricoes.length == 0
    ) {
      setListaDescricoes([descricoesFiltradas]);
      setTabelaVazia(true);
      return;
    }
    setListaDescricoes(descricoes);
    setTabelaVazia(false);
  }

  useEffect(() => {
    setarFiltro();
  }, [descricoes, descricoesFiltradas]);

  return (
    <div className="mt-5 relative w-full overflow-auto overflow-x-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
      <table className="min-w-[1400px] w-full text-sm text-white/90">
        <thead className="bg-white/10 text-white/80 sticky top-0 z-20">
          <tr className="divide-x divide-white/10">
            <th className="px-4 py-3 text-left font-medium">Setor</th>
            <th className="px-4 py-3 text-left font-medium">Função</th>
            <th className="px-4 py-3 text-left font-medium">Escolaridade</th>
            <th className="px-4 py-3 text-left font-medium">Treinamento</th>
            <th className="px-4 py-3 text-left font-medium">
              Competências Comportamentais
            </th>
            <th className="px-4 py-3 text-left font-medium">
              Competências Técnicas
            </th>
            <th className="px-4 py-3 text-left font-medium">Experiência</th>
            <th className="px-4 py-3 text-left font-medium">
              Principais responsabilidades
            </th>
          </tr>
        </thead>
        {!tabelaVazia ? (
          <tbody className="divide-y divide-white/10">
            {listaDescricoes.map((descricao) => (
              <tr
                key={descricao.descricao_id}
                className={
                  clicado == descricao.descricao_id
                    ? "bg-white/8 hover:bg-white/12 transition-colors"
                    : "hover:bg-white/3 transition-colors"
                }
                onClick={() => selecionaCampo(descricao.descricao_id)}
                onDoubleClick={() => abreModificacao(descricao)}
              >
                <td className="px-4 py-3">
                  {descricao.setor != null ? descricao.setor.setor_nome : "-"}
                </td>
                <td className="px-4 py-3">
                  {descricao.cargo.cargo_nome || "-"}
                </td>
                <td className="px-4 py-3">
                  {descricao.descricao_escolaridade || "-"}
                </td>
                <td className="px-4 py-3">
                  {descricao.descricao_treinamento || "-"}
                </td>
                <td className="px-4 py-3 whitespace-pre-wrap break-words">
                  {descricao.descricao_comportamentos || "-"}
                </td>
                <td className="px-4 py-3 whitespace-pre-wrap break-words">
                  {descricao.descricao_tecnicas || "-"}
                </td>
                <td className="px-4 py-3">
                  {descricao.descricao_experiencia || "-"}
                </td>
                <td className="px-4 py-3 whitespace-pre-wrap break-words">
                  {descricao.descricao_responsabilidades || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td colSpan={8} className="px-6 py-10 text-center">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
                  <SearchX size={16} className="opacity-80" />
                  Nenhum cargo encontrado
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
