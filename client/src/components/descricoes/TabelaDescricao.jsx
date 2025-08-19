function TabelaDescricao({ descricoes, setDesc, setModificaDesc }) {
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

        <tbody className="divide-y divide-white/10">
          {descricoes.map((descricao) => (
            <tr
              className="hover:bg-white/5 transition-colors align-top"
              onDoubleClick={() => abreModificacao(descricao)}
            >
              <td className="px-4 py-3">
                {descricao.setor != null ? descricao.setor.setor_nome : "-"}
              </td>
              <td className="px-4 py-3">{descricao.cargo.cargo_nome || "-"}</td>
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
      </table>
    </div>
  );
}

export default TabelaDescricao;
