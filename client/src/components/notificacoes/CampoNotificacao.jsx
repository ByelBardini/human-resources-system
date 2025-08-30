/* eslint-disable react-hooks/exhaustive-deps */
import { useAviso } from "../../context/AvisoContext";
import { Download, XCircle, Timer } from "lucide-react";
import { useEffect, useState } from "react";

const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const [ymd, hms] = s.split(" ");
  const [y, m, d] = (ymd || "").split("-").map(Number);
  if (!y || !m || !d) return null;

  let hh = 0,
    mm = 0,
    ss = 0;
  if (hms) {
    [hh, mm, ss] = hms.split(":").map((n) => Number(n || 0));
  }
  const date = new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
  return Number.isFinite(date.getTime()) ? date : null;
};

function CampoNotificacao({
  key,
  data,
  dataFim,
  descricao,
  arquivo,
  formatarData,
  tipo,
  falta,
}) {
  const {mostrarAviso}=useAviso();
  const [dias, setDias] = useState(0);
  const temDataFinal = tipo == "suspensao" || tipo == "atestado";

  async function baixar(caminho) {
    const url = `http://localhost:3030/download?path=${encodeURIComponent(
      caminho
    )}`;
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) {
      mostrarAviso("erro", "Erro ao realizar o download", true)
      return;
    }

    const blob = await resp.blob();
    const nome = caminho.split("/").pop() || "arquivo";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  useEffect(() => {
    if (temDataFinal) {
      const inicio = parseDate(data);
      const fim = parseDate(dataFim);

      const ms = fim - inicio;
      const dias = Math.max(0, Math.floor(ms / 86400000) + 1);
      setDias(dias);
    }
  }, [data, dataFim]);

  return (
    <div
      key={key}
      className="mt-3 items-center flex flex-col sm:flex-row gap-3 group"
    >
      <div className="text-center sm:min-w-[110px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 shadow-sm group-hover:bg-white/10 transition-colors">
        {data != "" ? formatarData(data) : " - "}
      </div>

      {temDataFinal && (
        <div className="text-center sm:min-w-[110px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 shadow-sm group-hover:bg-white/10 transition-colors">
          {dias}
        </div>
      )}

      {temDataFinal && (
        <div className="text-center sm:min-w-[110px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 shadow-sm group-hover:bg-white/10 transition-colors">
          {dataFim != "" ? formatarData(dataFim) : " - "}
        </div>
      )}

      <div className="text-center flex items-center w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 shadow-sm group-hover:bg-white/10 transition-colors">
        <div className="w-7/8">
          {descricao != "" ? descricao : " -- Sem descrição da notificação -- "}
        </div>

        {falta &&
          (tipo == "falta" ? (
            <span className="w-1/8 justify-center inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs bg-red-500/15 text-red-200 border-red-400/30 whitespace-nowrap shrink-0">
              Falta <XCircle size={16} />
            </span>
          ) : (
            <span className="w-1/8 justify-center flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs bg-amber-500/15 text-amber-200 border-amber-400/30 whitespace-nowrap shrink-0">
              Meia-Falta <Timer size={16} />
            </span>
          ))}
      </div>

      {arquivo != null && (
        <button
          type="button"
          onClick={() => baixar(arquivo)}
          className="text-center cursor-pointer rounded-xl bg-white/5 border border-white/10 w-12 h-12 shrink-0 grid place-items-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Download size={18} />
        </button>
      )}
    </div>
  );
}

export default CampoNotificacao;
