/* eslint-disable react-hooks/exhaustive-deps */
import { X, Upload, Image as ImageIcon, UserPlus, User, Briefcase, Phone, Calendar, CreditCard, Users } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { formatToCPFOrCNPJ, isCPF, formatToPhone } from "brazilian-values";
import {
  postFuncionario,
  getCargoSetor,
} from "../../services/api/funcionarioService.js";
import { listarPerfisJornadaPublico } from "../../services/api/perfilJornadaService.js";
import CustomSelect from "../default/CustomSelect.jsx";
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

  // Estados para cadastro de usuário
  const [criarUsuario, setCriarUsuario] = useState(false);
  const [perfilJornadaId, setPerfilJornadaId] = useState("");
  const [loginUsuario, setLoginUsuario] = useState("");
  const [perfisJornada, setPerfisJornada] = useState([]);
  const [batidaForaEmpresa, setBatidaForaEmpresa] = useState(false);

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

  async function getPerfisJornada() {
    try {
      const response = await listarPerfisJornadaPublico();
      setPerfisJornada(response.perfis || []);
    } catch (err) {
      console.error("Erro ao buscar perfis de jornada:", err);
      setPerfisJornada([]);
    }
  }

  useEffect(() => {
    getCargosSetores();
    getPerfisJornada();
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
      setor === "" ||
      cargo === "" ||
      nivel === "" ||
      nome === "" ||
      cpf === "" ||
      telefone === "" ||
      sexo === "" ||
      nascimento === "" ||
      admissao === ""
    ) {
      mostrarAviso("erro", "Todos os dados são necessários!", true);
      return;
    }
    if (cpfValido === false) {
      mostrarAviso("erro", "CPF inválido!", true);
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

    // Validar se perfil de jornada foi selecionado quando checkbox estiver marcado
    if (criarUsuario && !perfilJornadaId) {
      mostrarAviso("erro", "Selecione um perfil de carga horária para criar o usuário!", true);
      return;
    }

    // Validar se login foi informado quando checkbox estiver marcado
    if (criarUsuario && !loginUsuario.trim()) {
      mostrarAviso("erro", "Informe o login do usuário!", true);
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
      funcionario_batida_fora_empresa: batidaForaEmpresa,
    };

    // Adicionar campos para criação de usuário se checkbox estiver marcado
    if (criarUsuario) {
      payload.criar_usuario = true;
      payload.perfil_jornada_id = perfilJornadaId;
      payload.usuario_login = loginUsuario.trim();
    }
    setCarregando(true);

    try {
      const response = await postFuncionario(payload, fotoFile);
      setCarregando(false);

      let mensagem = "Funcionário inserido com sucesso!";
      if (response.usuario_criado && response.usuario_login) {
        mensagem = `Funcionário inserido com sucesso!\nUsuário criado automaticamente.\nLogin: ${response.usuario_login}\nSenha padrão: 12345`;
      }

      mostrarAviso("sucesso", mensagem, true);
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
      className="fixed inset-0 z-150 animate-in fade-in duration-200"
      onClick={() => setAdicionandoFunc(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300"
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <UserPlus size={22} className="text-white" />
                </div>
                <h2 className="text-white text-lg font-semibold">Novo Funcionário</h2>
              </div>
              <button
                onClick={() => setAdicionandoFunc(false)}
                type="button"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-6">
            <div className="flex gap-6">
              {/* Coluna esquerda - Foto */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div 
                    onClick={abrirSeletor}
                    className="h-[180px] w-[150px] rounded-xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden flex flex-col items-center justify-center text-white/40 transition-all duration-200 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5"
                  >
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Foto" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <User size={36} strokeWidth={1.5} />
                        <span className="text-xs mt-2 text-white/30">Clique para<br/>selecionar</span>
                      </>
                    )}
                  </div>
                  {fotoPreview && (
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelectImagem} />
              </div>

              {/* Coluna direita - Campos */}
              <div className="flex-1">
                {/* Divisor - Dados Pessoais */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/10" />
                  <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Dados Pessoais</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {/* Linha 1: Nome | Sexo */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <User size={14} /> Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Digite o nome completo"
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Users size={14} /> Sexo
                    </label>
                    <CustomSelect value={sexo} onChange={(e) => setSexo(e.target.value)}>
                      <option hidden value="">Selecione...</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </CustomSelect>
                  </div>

                  {/* Linha 2: CPF | Telefone */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <CreditCard size={14} /> CPF
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={14}
                      value={cpf}
                      onChange={validaFormataCPF}
                      placeholder="000.000.000-00"
                      className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${
                        cpfValido === false ? "border-red-500/50" : cpfValido === true ? "border-green-500/50" : "border-white/10"
                      } text-white placeholder-white/30 outline-none focus:bg-white/10 transition-all`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Phone size={14} /> Telefone
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={15}
                      value={telefone}
                      onChange={formatarTelefone}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  {/* Linha 3: Nascimento | (vazio) */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Calendar size={14} /> Nascimento
                    </label>
                    <input
                      type="date"
                      value={nascimento}
                      min={"1900-01-01"}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => dataNascimento(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>

                  <div>{/* Espaço vazio */}</div>
                </div>

                {/* Divisor - Dados Profissionais */}
                <div className="flex items-center gap-3 mt-5 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/10" />
                  <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Dados Profissionais</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {/* Linha 4: Setor | Nível */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Briefcase size={14} /> Setor
                    </label>
                    <CustomSelect value={setor} onChange={(e) => setSetor(e.target.value)}>
                      <option hidden value="">Selecione...</option>
                      {setores.map((s) => (
                        <option key={s.setor_id} value={s.setor_id}>{s.setor_nome}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Users size={14} /> Nível
                    </label>
                    <CustomSelect value={nivel} onChange={(e) => setNivel(e.target.value)}>
                      <option hidden value="">Selecione...</option>
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

                  {/* Linha 5: Função | Admissão */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Briefcase size={14} /> Função
                    </label>
                    <CustomSelect value={cargo} onChange={(e) => setCargo(e.target.value)}>
                      <option hidden value="">Selecione...</option>
                      {cargos.map((c) => (
                        <option key={c.cargo_id} value={c.cargo_id}>{c.cargo_nome}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5 font-medium">
                      <Calendar size={14} /> Admissão
                    </label>
                    <input
                      type="date"
                      value={admissao}
                      min={"1900-01-01"}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => dataAdmissao(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer com opções */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 overflow-visible">
            <div className="flex items-center gap-5">
              {/* Toggle Cadastrar usuário */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={criarUsuario}
                    onChange={(e) => {
                      setCriarUsuario(e.target.checked);
                      if (!e.target.checked) { 
                        setPerfilJornadaId(""); 
                        setLoginUsuario(""); 
                        setBatidaForaEmpresa(false);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-300" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Cadastrar usuário</span>
              </label>

              {/* Toggle Ponto fora */}
              <label className={`flex items-center gap-3 group ${criarUsuario ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={batidaForaEmpresa}
                    onChange={(e) => criarUsuario && setBatidaForaEmpresa(e.target.checked)}
                    disabled={!criarUsuario}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${criarUsuario ? 'bg-white/10 peer-checked:bg-emerald-500' : 'bg-white/5'}`} />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-5" />
                </div>
                <span className={`text-sm transition-colors ${criarUsuario ? 'text-white/70 group-hover:text-white/90' : 'text-white/40'}`}>Ponto fora da empresa</span>
              </label>

              {criarUsuario && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <input
                    type="text"
                    value={loginUsuario}
                    onChange={(e) => setLoginUsuario(e.target.value)}
                    placeholder="Login do usuário"
                    className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-white placeholder-white/40 outline-none focus:bg-blue-500/15 transition-all w-40"
                  />
                  {perfisJornada.length > 0 && (
                    <div className="w-40">
                      <CustomSelect value={perfilJornadaId} onChange={(e) => setPerfilJornadaId(e.target.value)} dropUp>
                        <option hidden value="">Jornada</option>
                        {perfisJornada.filter((p) => p.perfil_jornada_ativo === 1).map((perfil) => (
                          <option key={perfil.perfil_jornada_id} value={perfil.perfil_jornada_id}>{perfil.perfil_jornada_nome}</option>
                        ))}
                      </CustomSelect>
                    </div>
                  )}
                </>
              )}

              {/* Espaço flexível */}
              <div className="flex-1" />

              {/* Botões à direita */}
              <button
                onClick={() => setAdicionandoFunc(false)}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={cadastraFuncionario}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <UserPlus size={18} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AdicionaFuncionarioModal);
