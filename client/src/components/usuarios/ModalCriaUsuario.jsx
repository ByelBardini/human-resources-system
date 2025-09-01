import { X, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { postUsuario } from "../../services/api/usuariosServices";
import { useAviso } from "../../context/AvisoContext";

function ModalCriaUsuario({
  setCria,
  setCarregando,
  setCadastrado,
  cadastrado,
  navigate,
}) {
  const { mostrarAviso, limparAviso } = useAviso();

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [role, setRole] = useState("");

  async function criaUsuario() {
    if (!nome || !login || !role) {
      mostrarAviso("erro", "Todos os dados são obrigatórios", true);
      return;
    }

    setCarregando(true);
    try {
      await postUsuario(nome, login, role);

      mostrarAviso(
        "sucesso",
        "Usuário cadastrado com sucesso!\nSenha padrão: 12345",
        true
      );

      setCadastrado(true);
      setCria(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        console.erro(err.message, err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      limparAviso();
      console.error(err.message, err, true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setNome("");
    setLogin("");
    setRole("");
  }, [cadastrado]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setCria(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cadastrar usuário</h2>
          <button
            className="rounded-lg p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Fechar"
            onClick={() => setCria(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="space-y-4"
          onKeyDown={(e) => e.key === "Enter" && criaUsuario()}
        >
          <div>
            <label className="block text-sm text-white/80 mb-1">
              Nome completo
            </label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: Maria da Silva"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ex.: maria.silva"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">
              Tipo de usuário
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            >
              <option hidden value="">
                Selecione...
              </option>
              <option className="bg-slate-900" value="adm">
                Administrador
              </option>
              <option className="bg-slate-900" value="usuario">
                Usuário Padrão
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={criaUsuario}
            className="inline-flex items-center gap-2 rounded-lg border bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25 px-3 py-1.5 text-sm transition"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCriaUsuario;
