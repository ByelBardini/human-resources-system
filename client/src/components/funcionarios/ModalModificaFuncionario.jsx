/* eslint-disable react-hooks/exhaustive-deps */
import { X, UploadCloud, Image } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useAviso } from "../../context/AvisoContext.jsx";
import CustomSelect from "../default/CustomSelect.jsx";
import {
  getCargoSetor,
  putFuncionario,
} from "../../services/api/funcionarioService.js";

function ModalModificaFuncionario({
  setModifica,
  setCarregando,
  setModificado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();

  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);

  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [nivel, setNivel] = useState("");
  const [celular, setCelular] = useState("");
  const [observacao, setObservacao] = useState("");
  const [batidaForaEmpresa, setBatidaForaEmpresa] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const inputRef = useRef(null);

  function abrirSeletor() {
    inputRef.current?.click();
  }

  function onSelectImagem(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    const url = URL.createObjectURL(file);
    setFotoFile(file);
    setFotoPreview(url);
  }

  async function getCargosSetores() {
    const id = localStorage.getItem("empresa_id");
    try {
      const response = await getCargoSetor(id);
      setSetores(response.setor);
      setCargos(response.cargo);
    } catch (err) {
      mostrarAviso("erro", err.message);
      console.error(err.message, err);
    }
  }

  async function modificaFuncionario() {
    const id = localStorage.getItem("funcionario_id");

    const payload = {
      funcionario_setor_id: setor,
      funcionario_cargo_id: cargo,
      funcionario_nivel: nivel,
      funcionario_observacao: observacao,
      funcionario_celular: celular,
      funcionario_batida_fora_empresa: batidaForaEmpresa,
    };
    setCarregando(true);

    try {
      await putFuncionario(id, payload, fotoFile);
      setCarregando(false);

      mostrarAviso("sucesso", "Funcionário modificado com sucesso!", true);
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        setModifica(false);
      }, 500);
    } catch (err) {
      if (err.status == 400) {
        console.error(err);
        setCarregando(false);
        mostrarAviso("erro", "Prencher todos os dados", true);
      } else {
        setCarregando(false);
        console.error(err.message, err, true);
        return;
      }
    }
  }

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  useEffect(() => {
    console.log(localStorage.getItem("imagem"));
    getCargosSetores();
    setSetor(localStorage.getItem("setor"));
    setCargo(localStorage.getItem("cargo"));
    setNivel(localStorage.getItem("nivel"));
    setCelular(localStorage.getItem("celular"));
    localStorage.getItem("observacao") != "null" &&
      setObservacao(localStorage.getItem("observacao"));
    localStorage.getItem("imagem") != "null" &&
      setFotoPreview(
        `${import.meta.env.VITE_API_BASE_URL}${localStorage.getItem("imagem")}`
      );
    const batidaFlag = localStorage.getItem("batida_fora_empresa");
    setBatidaForaEmpresa(batidaFlag === "1");
  }, []);

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setModifica(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl text-white shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 rounded-t-2xl">
          <h2 className="text-lg font-semibold tracking-wide">
            Modificar Funcionário
          </h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
            title="Fechar"
            onClick={() => setModifica(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:[grid-template-columns:300px_minmax(0,1fr)] gap-8 items-start">
            <aside className="space-y-4 w-[300px] shrink-0">
              <div
                className="p-2 w-full aspect-square max-h-[280px] rounded-2xl border border-white/15
               bg-white/5 flex items-center justify-center text-white/60
               shadow-[0_10px_30px_rgba(0,0,0,.25)]"
              >
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Pré-visualização"
                    className="h-full w-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Image size={64} />
                    <span className="text-sm">Sem foto</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/70 mb-2">Foto</div>

                <div
                  className="rounded-xl border border-dashed border-white/20 bg-white/5
                 px-4 py-6 flex flex-col items-center justify-center gap-2 text-center"
                >
                  <UploadCloud size={18} />
                  <span className="text-sm text-white/80">
                    Arraste uma imagem aqui
                  </span>
                  <span className="text-xs text-white/50">
                    .jpg, .png — até 5MB
                  </span>

                  <button
                    type="button"
                    onClick={abrirSeletor}
                    className="mt-3 px-3 py-1.5 text-sm rounded-lg
                   bg-white/10 border border-white/20 hover:bg-white/20 transition"
                  >
                    Selecionar foto
                  </button>

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSelectImagem}
                  />

                  {fotoFile && (
                    <p className="mt-2 text-xs text-white/70 w-full truncate">
                      Selecionado:{" "}
                      <span className="text-white/90">{fotoFile.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </aside>

            <section className="space-y-6 min-w-0 self-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Setor
                  </label>
                  <CustomSelect value={setor} onChange={(e) => setSetor(e.target.value)}>
                    {setores.map((s) => (
                      <option key={s.setor_id} value={s.setor_id}>
                        {s.setor_nome}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Função
                  </label>
                  <CustomSelect value={cargo} onChange={(e) => setCargo(e.target.value)}>
                    {cargos.map((c) => (
                      <option key={c.cargo_id} value={c.cargo_id}>
                        {c.cargo_nome}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Nível
                  </label>
                  <CustomSelect value={nivel} onChange={(e) => setNivel(e.target.value)}>
                    <option value="Inicial">Inicial</option>
                    <option value="Júnior I">Júnior I</option>
                    <option value="Júnior II">Júnior II</option>
                    <option value="Júnior III">Júnior III</option>
                    <option value="Pleno I">Pleno I</option>
                    <option value="Pleno II">Pleno II</option>
                    <option value="Pleno III">Pleno III</option>
                    <option value="Sênior I">Sênior I</option>
                    <option value="Sênior II">Sênior II</option>
                    <option value="Sênior III">Sênior III</option>
                  </CustomSelect>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm text-white/70 mb-1">
                    Celular
                  </label>
                  <input
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 focus:border-white/30"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batidaForaEmpresa}
                      onChange={(e) => setBatidaForaEmpresa(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/30"
                    />
                    <span className="text-sm text-white/70">
                      Batidas de ponto fora da empresa
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Observação
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={5}
                  placeholder="Observações, responsabilidades, etc."
                  className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 focus:border-white/30"
                />
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-white/5 rounded-b-2xl">
          <button
            type="button"
            onClick={() => setModifica(false)}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/5 border border-white/15 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={modificaFuncionario}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/10 border border-white/20 hover:bg-white/20 transition"
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ModalModificaFuncionario);
