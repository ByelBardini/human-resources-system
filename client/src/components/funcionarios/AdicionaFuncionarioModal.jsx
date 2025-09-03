/* eslint-disable react-hooks/exhaustive-deps */
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatToCPFOrCNPJ, isCPF, formatToPhone } from "brazilian-values";
import {
  postFuncionario,
  getCargoSetor,
} from "../../services/api/funcionarioService.js";
import { useAviso } from "../../context/AvisoContext.jsx";

function AdicionaFuncionarioModal({
  setAdicionandoFunc,
  setCarregando,
  setModificado,
}) {
  const { mostrarAviso, limparAviso } = useAviso();
  const [setores, setSetores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [cpfValido, setCpfValido] = useState(null);
  const [nascimentoValido, setNascimentoValido] = useState(null);
  const [admissaoValido, setAdmissaoValido] = useState(null);

  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivel, setNivel] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState("");
  const [nascimento, setNascimento] = useState(null);
  const [admissao, setAdmissao] = useState("");

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const inputRef = useRef(null);

  async function getCargosSetores() {
    const id = localStorage.getItem("empresa_id");
    try {
      const response = await getCargoSetor(id);
      setSetores(response.setor);
      setCargos(response.cargo);
    } catch (err) {
      mostrarAviso("erro", err.message, true);
      console.error(err.message, err);
    }
  }

  useEffect(() => {
    getCargosSetores();
  }, []);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

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

  function validaFormataCPF(e) {
    const cpf = e.target.value;
    setCpf(formatToCPFOrCNPJ(cpf));
    if (cpf.length === 14 ? isCPF(cpf) : null) {
      setCpfValido(true);
    } else {
      setCpfValido(false);
    }
  }

  function formatarTelefone(e) {
    const telefone = e.target.value;
    setTelefone(formatToPhone(telefone));
  }

  function dataNascimento(e) {
    const dateNascimento = e;
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("en-CA");
    if (dateNascimento > dataFormatada) {
      mostrarAviso("erro", "Data de nascimento inválida!", true);
      setNascimento("");
      setNascimentoValido(false);
    } else {
      setNascimentoValido(true);
      setNascimento(e);
    }
  }

  function dataAdmissao(e) {
    const dataAdmissao = e;
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("en-CA");
    if (dataAdmissao > dataFormatada) {
      mostrarAviso("erro", "Data de admissão inválida!", true);
      setAdmissao("");
      setAdmissaoValido(false);
    } else {
      setAdmissaoValido(true);
      setAdmissao(e);
    }
  }

  async function cadastraFuncionario() {
    const id = localStorage.getItem("empresa_id");
    if (
      setor == "" ||
      cargo == "" ||
      nivel == "" ||
      nome == "" ||
      cpf == "" ||
      telefone == "" ||
      sexo == "" ||
      nascimento == "" ||
      admissao == ""
    ) {
      mostrarAviso("erro", "Todos os dados são necessários!", true);
      return;
    }
    if (cpfValido === false) {
      mostrarAviso("erro", "CPF inválido!");
      return;
    }
    if (nascimentoValido === false) {
      mostrarAviso("erro", "Data de nascimento inválida!", true);
      return;
    }
    if (admissaoValido === false) {
      mostrarAviso("erro", "Data de admissão inválida!", true);
      return;
    }

    const payload = {
      funcionario_empresa_id: id,
      funcionario_setor_id: setor,
      funcionario_cargo_id: cargo,
      funcionario_nivel: nivel,
      funcionario_nome: nome,
      funcionario_cpf: cpf,
      funcionario_celular: telefone,
      funcionario_sexo: sexo,
      funcionario_data_nascimento: nascimento,
      funcionario_data_admissao: admissao,
    };
    setCarregando(true);

    try {
      await postFuncionario(payload, fotoFile);
      setCarregando(false);

      mostrarAviso("sucesso", "Funcionário inserido com sucesso!", true);
      setModificado(true);
      setTimeout(() => {
        limparAviso();
        setAdicionandoFunc(false);
      }, 500);
    } catch (err) {
      setCarregando(false);
      mostrarAviso("erro", err.message, true);
      console.error(err.message, err);
      return;
    }
  }

  return (
    <div
      className="fixed inset-0 z-150"
      onClick={() => setAdicionandoFunc(false)}
    >
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">
              Adicionar Novo Funcionário
            </h2>
            <button
              onClick={() => setAdicionandoFunc(false)}
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-white/20"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[70vh] overflow-auto">
            <div className="mb-6">
              <label className="block text-sm text-white/70 mb-2">Foto</label>

              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-white/10 bg-white/10 overflow-hidden flex items-center justify-center text-white/60">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Pré-visualização"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={abrirSeletor}
                    className="px-3 py-2 rounded-lg bg-white/15 border border-white/15 text-white hover:bg-white/25"
                  >
                    <div className="flex items-center gap-2">
                      <Upload size={16} /> <span>Selecionar foto</span>
                    </div>
                  </button>
                  <span className="text-xs text-white/60">JPG, PNG</span>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectImagem}
              />

              {fotoFile && (
                <p className="mt-2 text-xs text-white/70">
                  Selecionado:{" "}
                  <span className="text-white/90">{fotoFile.name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 outline-none focus:bg-white/15"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Setor
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                  onChange={(e) => setSetor(e.target.value)}
                  value={setor}
                >
                  <option className="bg-slate-900" hidden>
                    Selecione…
                  </option>
                  {setores.map((s) => (
                    <option
                      key={s.setor_id}
                      value={s.setor_id}
                      className="bg-slate-900"
                    >
                      {s.setor_nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Função
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                  onChange={(e) => setCargo(e.target.value)}
                  value={cargo}
                >
                  <option className="bg-slate-900" hidden>
                    Selecione…
                  </option>
                  {cargos.map((c) => (
                    <option
                      key={c.cargo_id}
                      value={c.cargo_id}
                      className="bg-slate-900"
                    >
                      {c.cargo_nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Nível
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                  onChange={(e) => setNivel(e.target.value)}
                >
                  <option className="bg-slate-900" hidden>
                    Selecione…
                  </option>
                  <option value={"Inicial"} className="bg-slate-900">
                    Inicial
                  </option>
                  <option value={"Júnior I"} className="bg-slate-900">
                    Júnior I
                  </option>
                  <option value={"Júnior II"} className="bg-slate-900">
                    Júnior II
                  </option>
                  <option value={"Júnior III"} className="bg-slate-900">
                    Júnior III
                  </option>
                  <option value={"Pleno I"} className="bg-slate-900">
                    Pleno I
                  </option>
                  <option value={"Pleno II"} className="bg-slate-900">
                    Pleno II
                  </option>
                  <option value={"Pleno III"} className="bg-slate-900">
                    Pleno III
                  </option>
                  <option value={"Sênior I"} className="bg-slate-900">
                    Sênior I
                  </option>
                  <option value={"Sênior II"} className="bg-slate-900">
                    Sênior II
                  </option>
                  <option value={"Sênior III"} className="bg-slate-900">
                    Sênior III
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">CPF</label>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={14}
                  value={cpf}
                  onChange={validaFormataCPF}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 py-2 rounded-xl bg-white/10 border ${
                    cpfValido === false ? "border-red-500" : "border-white/10"
                  } text-white placeholder-white/40 outline-none focus:bg-white/15`}
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={15}
                  value={telefone}
                  onChange={formatarTelefone}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 outline-none focus:bg-white/15"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Sexo</label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                  onChange={(e) => setSexo(e.target.value)}
                >
                  <option className="bg-slate-900" hidden>
                    Selecione…
                  </option>
                  <option value={"masculino"} className="bg-slate-900">
                    Masculino
                  </option>
                  <option value={"feminino"} className="bg-slate-900">
                    Feminino
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={nascimento}
                  min={"1900-01-01"}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    dataNascimento(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Data de Admissão
                </label>
                <input
                  type="date"
                  value={admissao}
                  min={"1900-01-01"}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => dataAdmissao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:bg-white/15"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
            <button
              onClick={() => setAdicionandoFunc(false)}
              type="button"
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={cadastraFuncionario}
              className="px-4 py-2 rounded-lg bg-white/20 border border-white/10 text-white hover:bg-white/30 shadow"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdicionaFuncionarioModal;
