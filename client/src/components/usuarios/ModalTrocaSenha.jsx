import { useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { trocaSenha } from "../../services/api/usuariosServices.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalTrocaSenha({ setTrocaSenha, setCarregando, navigate }) {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const { mostrarAviso, limparAviso } = useAviso();

  const valido = senha.length >= 4 && senha === confirma;

  async function trocarSenha() {
    setCarregando(true);
    try {
      await trocaSenha(senha);

      mostrarAviso("Sucesso", "Sua senha foi alterada com sucesso!", true);
      localStorage.setItem("usuario_troca_senha", 0);

      setTrocaSenha(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        console.log(err);
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        setTimeout(() => {
          limparAviso;
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
        limparAviso;
        console.error(err);
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Trocar senha</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={show1 ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 pr-10 outline-none focus:border-white/30"
                placeholder="Mínimo 8 caracteres"
                aria-invalid={senha.length > 0 && senha.length < 8}
              />
              <button
                type="button"
                onClick={() => setShow1((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                aria-label={show1 ? "Ocultar senha" : "Mostrar senha"}
              >
                {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                type={show2 ? "text" : "password"}
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 pr-10 outline-none focus:border-white/30"
                placeholder="Repita a senha"
                aria-invalid={confirma.length > 0 && confirma !== senha}
              />
              <button
                type="button"
                onClick={() => setShow2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                aria-label={
                  show2 ? "Ocultar confirmação" : "Mostrar confirmação"
                }
              >
                {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-white/60">
            Use ao menos 4 caracteres. As senhas devem coincidir.
          </p>
          {!valido && (senha.length > 0 || confirma.length > 0) && (
            <p className="text-xs text-red-300">
              {senha.length < 4
                ? "A senha precisa ter pelo menos 4 caracteres."
                : confirma !== senha
                ? "As senhas não coincidem."
                : ""}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={!valido}
            onClick={trocarSenha}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition border
              ${
                valido
                  ? "bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25"
                  : "bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
              }`}
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalTrocaSenha;
