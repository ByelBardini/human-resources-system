/* eslint-disable react-hooks/exhaustive-deps */
import { Filter, Plus, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import CampoNotificacao from "./CampoNotificacao.jsx";

function Notificacoes({
  setOpenSec,
  openSec,
  sections,
  notificacoes,
  formatarData,
  setNotificacao,
  setAviso,
  setCorAviso,
  setTextoAviso,
}) {
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState([]);
  const [falta, setFalta] = useState(false);
  const [temFim, setTemFim] = useState(false);

  function setaNotificacoes() {
    switch (openSec) {
      case "faltas":
        localStorage.setItem("notificacao_tipo", "falta");
        setNotificacaoSelecionada(notificacoes.faltas);
        setFalta(true);
        break;
      case "atestados":
        localStorage.setItem("notificacao_tipo", "atestado");
        setNotificacaoSelecionada(notificacoes.atestados);
        setFalta(false);
        break;
      case "advertencias":
        localStorage.setItem("notificacao_tipo", "advertencia");
        setNotificacaoSelecionada(notificacoes.advertencias);
        setFalta(false);
        break;
      case "suspensoes":
        localStorage.setItem("notificacao_tipo", "suspensao");
        setNotificacaoSelecionada(notificacoes.suspensoes);
        setFalta(false);
        break;
    }
  }

  useEffect(() => {
    setaNotificacoes();
    if (openSec == "atestados" || openSec == "suspensoes") {
      setTemFim(true);
    } else {
      setTemFim(false);
    }
  }, [notificacoes, openSec]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="font-medium capitalize">
          {sections.find((s) => s.key === openSec)?.label}
        </span>
        <div className="w-full flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur px-3 py-1.5 text-sm text-white/90 shadow">
            <span className="uppercase tracking-wide text-white/70">Total</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 border border-white/20 px-2 font-semibold">
              {notificacaoSelecionada.length}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20"
            onClick={() => setNotificacao(true)}
          >
            <Plus size={16} /> Novo
          </button>
          <button className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20">
            <Filter size={16} /> Filtro
          </button>
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
                setAviso={setAviso}
                setCorAviso={setCorAviso}
                setTextoAviso={setTextoAviso}
              />
            ))
          ) : (
            <div className="mt-3 w-full flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur px-3 py-1.5 text-sm text-white/90 shadow">
                <span className="uppercase tracking-wide text-white/70">
                  Nenhuma notificação encontrada!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notificacoes;
