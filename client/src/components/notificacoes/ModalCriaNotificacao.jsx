import { X, UploadCloud, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { postNotificacao } from "../../services/api/notificacoesServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalCriaNotificacao({
  setNotificacao,
  setCarregando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setAdicionado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [emitirAdvertencia, setEmitirAdvertencia] = useState(false);
  const [emitirSuspensao, setEmitirSuspensao] = useState(false);
  const [arquivo, setArquivo] = useState("");
  const [duracaoDias, setDuracaoDias] = useState("");

  const esconderCampos = tipo === "atestado" || tipo === "suspensao";

  function onSelectArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
  }

  const formatarData = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  function clicaEnviar() {
    setTextoConfirmacao("Você tem certeza que deseja emitir essa notificação?");
    setOnSimConfirmacao(() => () => enviarNotificacoes());
    setConfirmacao(true);
  }

  async function enviarNotificacoes() {
    setConfirmacao(false);
    const id = localStorage.getItem("funcionario_id");
    if (tipo == "" || data == "") {
      mostrarAviso("erro", "Data e tipo são obrigatórios!");
      return;
    }
    const payload = {
      notificacao_tipo: tipo,
      notificacao_data: data,
      notificacao_descricao: descricao,
      notificacao_data_final: dataFim,
      notificacao_emitir_advertencia: emitirAdvertencia,
      notificacao_emitir_suspensao: emitirSuspensao,
    };
    setCarregando(true);
    try {
      await postNotificacao(id, payload, arquivo);
      setCarregando(false);

      mostrarAviso("sucesso", "Notificação criada com sucesso!");
      setTimeout(() => {
        limparAviso;
        setAdicionado(true);
        setNotificacao(false);
      });
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message);
      console.error(err.message, err)
    }
  }

  useEffect(() => {
    setTipo(localStorage.getItem("notificacao_tipo") || "");
  }, []);

  useEffect(() => {
    if (!data || !dataFim) {
      setDuracaoDias("Inválido!");
      return;
    }
    const inicio = formatarData(data);
    const fim = formatarData(dataFim);

    const ms = fim - inicio;
    if (Number.isNaN(ms)) {
      setDuracaoDias(0);
      return;
    }

    const dias = Math.max(0, Math.floor(ms / 86400000) + 1);
    setDuracaoDias(dias);
  }, [data, dataFim]);

  return (
    <div
      className="fixed inset-0 z-51 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setNotificacao(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10
                      bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold">Nova Notificação</h2>
          <button
            type="button"
            title="Fechar"
            className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl
                       bg-white/10 border border-white/10 hover:bg-white/20"
            onClick={() => setNotificacao(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-full px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`col-span-1 ${esconderCampos ? "sm:col-span-2" : ""}`}
            >
              <label className="block text-sm text-white/70 mb-1">Tipo</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                           outline-none focus:bg-white/15"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="" disabled hidden className="bg-slate-900">
                  Selecione…
                </option>
                <option value={"falta"} className="bg-slate-900">
                  Falta
                </option>
                <option value={"meia-falta"} className="bg-slate-900">
                  Meia-falta
                </option>
                <option value={"atestado"} className="bg-slate-900">
                  Atestado
                </option>
                <option value={"advertencia"} className="bg-slate-900">
                  Advertência
                </option>
                <option value={"suspensao"} className="bg-slate-900">
                  Suspensão
                </option>
              </select>
            </div>

            {!esconderCampos && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Data</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                   outline-none focus:bg-white/15 [color-scheme:dark]"
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
            )}
          </div>

          {esconderCampos && (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                   outline-none focus:bg-white/15 [color-scheme:dark]"
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Data do Fim
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/90
                   outline-none focus:bg-white/15 [color-scheme:dark]"
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-1/4 justify-self-center">
                <label className="block text-sm text-white/70 mb-1 text-center">
                  Duração em dias
                </label>
                <input
                  value={duracaoDias}
                  type="text"
                  placeholder="Quantidade de dias"
                  disabled
                  className="text-center w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40"
                  onChange={(e) => setDescricao(e.target.value)}
                ></input>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Descrição
            </label>
            <textarea
              rows={4}
              placeholder="Descreva a notificação…"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40
                         outline-none focus:bg-white/15 resize-y min-h-28 whitespace-pre-wrap break-words leading-relaxed"
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Anexo</label>
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/10 grid place-items-center">
                  <UploadCloud size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 flex items-center gap-2">
                    <span
                      className={`truncate ${arquivo ? "text-white/90" : ""}`}
                      title={arquivo?.name}
                    >
                      {arquivo ? arquivo.name : "Selecionar arquivo"}
                    </span>
                  </div>
                  <div className="text-xs text-white/50">
                    JPG, PNG ou PDF • até 5MB
                    {arquivo && (
                      <span className="ml-2 text-white/40">
                        ({(arquivo.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                </div>

                {arquivo ? (
                  <button
                    className="cursor-pointer px-2 py-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-sm shrink-0"
                    onClick={() => setArquivo(null)}
                  >
                    X
                  </button>
                ) : (
                  ""
                )}
                <label
                  htmlFor="anexo-notificacao"
                  className="cursor-pointer px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-sm shrink-0"
                >
                  Procurar…
                </label>

                <input
                  id="anexo-notificacao"
                  type="file"
                  className="hidden"
                  onChange={onSelectArquivo}
                  accept="image/jpeg,image/png,application/pdf"
                  aria-live="polite"
                />
              </div>
            </div>
          </div>

          {tipo.includes("falta") && (
            <label className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-md border-white/20 bg-white/10 text-white
                         accent-white/80"
                onChange={() => setEmitirAdvertencia(!emitirAdvertencia)}
              />
              <span className="inline-flex items-center gap-2 text-amber-500/90">
                <AlertTriangle size={16} className="opacity-80" />
                Emitir advertência
              </span>
            </label>
          )}
          {tipo == "advertencia" && (
            <label className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-md border-white/20 bg-white/10 text-white
                         accent-white/80"
                onChange={() => setEmitirSuspensao(!emitirSuspensao)}
              />
              <span className="inline-flex items-center gap-2 text-red-500/90">
                <AlertTriangle size={16} className="opacity-80" />
                Emitir suspensão
              </span>
            </label>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
            onClick={() => setNotificacao(false)}
          >
            Cancelar
          </button>
          <button
            onClick={clicaEnviar}
            type="button"
            className="cursor-pointer px-4 py-2 rounded-lg bg-white/20 border border-white/10 hover:bg-white/30 shadow"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCriaNotificacao;
