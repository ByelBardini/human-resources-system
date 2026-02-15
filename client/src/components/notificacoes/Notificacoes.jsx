/* eslint-disable react-hooks/exhaustive-deps */
import { Plus, EyeOff, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import CampoNotificacao from "./CampoNotificacao.jsx";
import FiltroNotificacoes from "./FiltroNotificacoes.jsx";

function Notificacoes({
  setOpenSec,
  openSec,
  sections,
  notificacoes,
  formatarData,
  setNotificacao,
  ativo,
}) {
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState([]);
  const [falta, setFalta] = useState(false);
  const [temFim, setTemFim] = useState(false);

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtradas, setFiltradas] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState(false);

  function setaNotificacoes() {
    switch (openSec) {
      case "faltas":
        localStorage.setItem("notificacao_tipo", "falta");
        filtroAtivo
          ? setNotificacaoSelecionada(filtradas.faltas)
          : setNotificacaoSelecionada(notificacoes.faltas);
        setFalta(true);
        break;
      case "atestados":
        localStorage.setItem("notificacao_tipo", "atestado");
        filtroAtivo
          ? setNotificacaoSelecionada(filtradas.atestados)
          : setNotificacaoSelecionada(notificacoes.atestados);
        setFalta(false);
        break;
      case "advertencias":
        localStorage.setItem("notificacao_tipo", "advertencia");
        filtroAtivo
          ? setNotificacaoSelecionada(filtradas.advertencias)
          : setNotificacaoSelecionada(notificacoes.advertencias);
        setFalta(false);
        break;
      case "suspensoes":
        localStorage.setItem("notificacao_tipo", "suspensao");
        filtroAtivo
          ? setNotificacaoSelecionada(filtradas.suspensoes)
          : setNotificacaoSelecionada(notificacoes.suspensoes);
        setFalta(false);
        break;
    }
  }

  useEffect(() => {
    setaNotificacoes();
    if (openSec === "atestados" || openSec === "suspensoes") {
      setTemFim(true);
    } else {
      setTemFim(false);
    }
  }, [notificacoes, openSec, filtradas]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="font-medium capitalize">
          {sections.find((s) => s.key === openSec)?.label}
        </span>
        <div className="w-full flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/15 backdrop-blur px-4 py-2 shadow">
            <span className="uppercase tracking-wide text-xs font-semibold text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              {filtroAtivo ? (
                <>{`${formatarData(dataInicial)} até ${formatarData(
                  dataFinal
                )}`}</>
              ) : (
                "Mês Atual"
              )}
            </span>

            <span className="uppercase tracking-wide text-xs font-semibold text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              Total: {notificacaoSelecionada.length}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {ativo === 1 && (
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              onClick={() => setNotificacao(true)}
            >
              <Plus size={16} /> Novo
            </button>
          )}
          <FiltroNotificacoes
            dataInicial={dataInicial}
            dataFinal={dataFinal}
            setDataInicial={setDataInicial}
            setDataFinal={setDataFinal}
            setFiltradas={setFiltradas}
            setFiltroAtivo={setFiltroAtivo}
          />
          <button
            onClick={() => setOpenSec(null)}
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20"
          >
            <EyeOff size={16} /> Ocultar
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex">
          <div className="text-center sm:min-w-[110px] ">
            <span>{temFim ? "Data Início" : "Data Fim"}</span>
          </div>
          {temFim && (
            <div className="flex min-w-[220px] gap-1">
              <div className="text-center sm:min-w-[120px] ">
                <span>Qtd. Dias</span>
              </div>
              <div className="text-center sm:min-w-[120px] ">
                <span>Data Fim</span>
              </div>
            </div>
          )}
          <div className="text-center w-full">
            <span>Descricão</span>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto mt-2">
          {notificacaoSelecionada.length > 0 ? (
            notificacaoSelecionada.map((n) => (
              <CampoNotificacao
                key={n.notificacao_id}
                data={n.notificacao_data}
                dataFim={n.notificacao_data_final}
                descricao={n.notificacao_descricao}
                arquivo={n.notificacao_imagem_caminho}
                formatarData={formatarData}
                tipo={n.notificacao_tipo}
                falta={falta}
              />
            ))
          ) : (
            <div className="mt-3 w-full flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
                <SearchX size={16} className="opacity-80" />
                Nenhuma notificação encontrada
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notificacoes;
