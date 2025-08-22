/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { X, ImageOff } from "lucide-react";
import { getFuncionarioFull } from "../../services/api/funcionarioService.js";
import { getNotificacoes } from "../../services/api/notificacoesServices.js";
import Notificacoes from "../notificacoes/Notificacoes.jsx";

const FUNCIONARIO_VAZIO = {
  funcionario_nome: "",
  funcionario_cpf: "",
  funcionario_celular: "",
  funcionario_sexo: "",
  funcionario_data_nascimento: "",
  funcionario_data_admissao: "",
  setor: { setor_nome: "" },
  cargo: { cargo_nome: "" },
  nivel: { nivel_nome: "", nivel_salario: 0 },
};

export default function CardFuncionario({
  adicionado,
  setAdicionado,
  setCard,
  setNotificacao,
  setAviso,
  setCorAviso,
  setTextoAviso,
}) {
  const [openSec, setOpenSec] = useState(null);
  const [funcionario, setFuncionario] = useState(FUNCIONARIO_VAZIO);
  const [notificacoes, setNotificacoes] = useState([]);

  const sections = [
    { key: "faltas", label: "Faltas" },
    { key: "atestados", label: "Atestados" },
    { key: "advertencias", label: "Advertências" },
    { key: "suspensoes", label: "Suspensões" },
  ];

  async function puxaDados() {
    const id = localStorage.getItem("funcionario_id");
    try {
      const funcionario = await getFuncionarioFull(id);
      const notificacoes = await getNotificacoes(id);
      console.log("Funcionário:", funcionario);
      console.log("Notificações:", notificacoes);
      setFuncionario(funcionario);
      setNotificacoes(notificacoes);
    } catch (err) {
      console.error("erro ao buscar funcionário:", err);
    }
  }

  useEffect(() => {
    puxaDados();
    setAdicionado(false);
  }, [adicionado]);

  function formatarData(val) {
    if (!val) return "";
    if (val instanceof Date) return val.toLocaleDateString("en-GB");

    const s = String(val);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mo, d] = m;
      const date = new Date(Number(y), Number(mo) - 1, Number(d));
      return date.toLocaleDateString("en-GB");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setCard(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-6xl rounded-2xl border border-white/10
                      bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-2xl text-white
                      max-h-[85vh] overflow-y-auto"
      >
        <div>
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold tracking-wide">FUNCIONÁRIO</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="cursor-pointer px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25"
                title="Inativar funcionário"
              >
                Inativar funcionário
              </button>
              <button
                type="button"
                className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
                title="Fechar"
                onClick={() => setCard(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8 ">
          <div className="grid grid-cols-1 md:[grid-template-columns:300px_minmax(0,1fr)] gap-8 items-start">
            <aside className="space-y-4 w-[300px] shrink-0">
              <div
                className="p-2 w-full aspect-square max-h-[280px] rounded-2xl border border-white/15 bg-white/5
                 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,.25)]"
              >
                {funcionario.funcionario_imagem_caminho != null ? (
                  <img
                    className="h-full w-full object-cover rounded-2xl"
                    src={`http://localhost:3030${funcionario.funcionario_imagem_caminho}`}
                  ></img>
                ) : (
                  <ImageOff size={82} />
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <div className="text-sm text-white/60">SETOR</div>
                <div className="font-medium">
                  {funcionario.setor.setor_nome || ""}
                </div>

                <div className="mt-3 text-sm text-white/60">CARGO</div>
                <div className="font-medium">
                  {funcionario.cargo.cargo_nome || ""} -{" "}
                  {funcionario.nivel.nivel_nome || ""}
                </div>

                <div className="mt-3 text-sm text-white/60">SALÁRIO</div>
                <div className="font-medium">
                  R${" "}
                  {funcionario.nivel.nivel_salario.toLocaleString("pt-br", {
                    minimumFractionDigits: 2,
                  }) || ""}
                </div>
              </div>
            </aside>

            <section className="space-y-6 min-w-0 self-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
                <Field
                  label="Nome"
                  value={funcionario.funcionario_nome || ""}
                />
                <Field label="CPF" value={funcionario.funcionario_cpf || ""} />
                <Field
                  label="Telefone"
                  value={funcionario.funcionario_celular || ""}
                />
                <Field
                  label="Sexo"
                  value={
                    funcionario.funcionario_sexo == "masculino"
                      ? "Masculino"
                      : "Feminino"
                  }
                />
                <Field
                  label="Data de Nascimento"
                  value={
                    formatarData(funcionario.funcionario_data_nascimento) || ""
                  }
                />
                <Field
                  label="Data de Admissão"
                  value={
                    formatarData(funcionario.funcionario_data_admissao) || ""
                  }
                />
              </div>

              <div>
                <div className="text-white/70 mb-1">Observações</div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 min-h-[120px]">
                  {funcionario.funcionario_observacao != null
                    ? funcionario.funcionario_observacao
                    : "— Sem observações no momento —"}
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  setOpenSec((prev) => (prev === s.key ? null : s.key))
                }
                className={`cursor-pointer px-4 py-2 rounded-lg border transition
                            ${
                              openSec === s.key
                                ? "bg-white/20 border-white/20"
                                : "bg-white/10 border-white/10 hover:bg-white/15"
                            }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {openSec && (
            <Notificacoes
              setOpenSec={setOpenSec}
              openSec={openSec}
              sections={sections}
              notificacoes={notificacoes}
              formatarData={formatarData}
              setNotificacao={setNotificacao}
              setAviso={setAviso}
              setCorAviso={setCorAviso}
              setTextoAviso={setTextoAviso}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
        {value}
      </div>
    </div>
  );
}
