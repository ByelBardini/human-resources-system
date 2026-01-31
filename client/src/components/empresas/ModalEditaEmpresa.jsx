import { X, Save, Upload, Power } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatToCPFOrCNPJ } from "brazilian-values";
import { putEmpresa, inativarEmpresa, getEmpresaImagem } from "../../services/api/empresasService.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function ModalEditaEmpresa({
  empresaSelecionada,
  setEdita,
  setCarregando,
  modificou,
  navigate: navigateProp,
}) {
  const navigateHook = useNavigate();
  const navigate = navigateProp || navigateHook;
  const { mostrarAviso, limparAviso } = useAviso();

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cor, setCor] = useState("#3b82f6");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoAtual, setLogoAtual] = useState(null);

  useEffect(() => {
    if (empresaSelecionada) {
      setNome(empresaSelecionada.empresa_nome || "");
      setCnpj(empresaSelecionada.empresa_cnpj || "");
      setCor(empresaSelecionada.empresa_cor || "#3b82f6");
      setLogoFile(null);
      setLogoPreview(null);
      
      // Carregar logo atual se existir
      if (empresaSelecionada.empresa_id) {
        getEmpresaImagem(empresaSelecionada.empresa_id)
          .then((imagem) => {
            if (imagem) {
              setLogoAtual(imagem);
            }
          })
          .catch(() => {
            // Ignora erro se não houver imagem
          });
      }
    }
  }, [empresaSelecionada]);

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        mostrarAviso("erro", "A logo deve ter no máximo 2MB", true);
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function editaEmpresa() {
    if (!nome || !cnpj || !cor) {
      mostrarAviso("erro", "Todos os dados são obrigatórios", true);
      return;
    }

    setCarregando(true);
    try {
      await putEmpresa(
        empresaSelecionada.empresa_id,
        {
          empresa_nome: nome,
          empresa_cnpj: cnpj,
          empresa_cor: cor,
        },
        logoFile
      );

      mostrarAviso("sucesso", "Empresa alterada com sucesso!", true);

      modificou(true);
      setEdita(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        console.error(err.message, err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
      }
      console.error(err.message, err);
    } finally {
      setCarregando(false);
    }
  }

  async function inativar() {
    setCarregando(true);
    try {
      await inativarEmpresa(empresaSelecionada.empresa_id);

      mostrarAviso(
        empresaSelecionada.empresa_ativo == 1 ? "aviso" : "sucesso",
        empresaSelecionada.empresa_ativo == 1
          ? "Empresa inativada com sucesso!"
          : "Empresa ativada com sucesso!",
        true
      );
      modificou(true);
      setEdita(false);
    } catch (err) {
      if (err.status == 401 || err.status == 403) {
        setCarregando(false);
        mostrarAviso("erro", "Sessão inválida! Realize o Login novamente!");
        console.error(err);
        setTimeout(() => {
          limparAviso();
          navigate("/", { replace: true });
        }, 1000);
      } else {
        mostrarAviso("erro", err.message, true);
        console.error(err.message, err);
      }
    } finally {
      setCarregando(false);
    }
  }

  const logoExibida = logoPreview || logoAtual;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setEdita(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Editar empresa</h2>
          <button
            className="rounded-lg p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Fechar"
            onClick={() => setEdita(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="space-y-4"
          onKeyDown={(e) => e.key === "Enter" && editaEmpresa()}
        >
          <div>
            <label className="block text-sm text-white/80 mb-1">
              Nome da empresa *
            </label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30 text-white"
              placeholder="Ex.: Empresa XYZ Ltda"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">CNPJ *</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatToCPFOrCNPJ(e.target.value))}
              maxLength={18}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30 text-white"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Cor *</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-16 h-10 rounded-lg border border-white/15 cursor-pointer"
              />
              <input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="flex-1 rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30 text-white"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Logo</label>
            <div className="space-y-2">
              {logoExibida ? (
                <div className="relative">
                  <img
                    src={logoExibida}
                    alt="Preview"
                    className="w-full h-32 object-contain rounded-lg border border-white/15 bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      if (!logoPreview) setLogoAtual(null);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-white/60 mb-2" />
                    <p className="mb-2 text-sm text-white/60">
                      <span className="font-semibold">Clique para upload</span> ou
                      arraste
                    </p>
                    <p className="text-xs text-white/40">
                      PNG, JPG ou WEBP (MAX. 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={inativar}
              className={`flex-1 px-4 py-2 rounded-lg border transition ${
                empresaSelecionada?.empresa_ativo == 1
                  ? "bg-red-500/15 border-red-400/30 text-red-300 hover:bg-red-500/25"
                  : "bg-green-500/15 border-green-400/30 text-green-300 hover:bg-green-500/25"
              } flex items-center justify-center gap-2`}
            >
              <Power size={18} />
              {empresaSelecionada?.empresa_ativo == 1 ? "Inativar" : "Ativar"}
            </button>
            <button
              onClick={() => setEdita(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={editaEmpresa}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-200 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditaEmpresa;
