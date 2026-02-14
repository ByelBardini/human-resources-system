/* eslint-disable react-hooks/exhaustive-deps */
import FiltroSexo from "./FiltroSexo";
import FiltroCargo from "./FiltroCargo";
import FiltroSetor from "./FiltroSetor";
import FiltroNivel from "./FiltroNivel";
import FiltroMesAniversario from "./FiltroMesAniversario";
import { useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

function FiltrosFuncionarios({
  funcionarios,
  nomeFiltro,
  setNomeFiltro,
  sexoFiltro,
  setSexoFiltro,
  setorFiltro,
  setSetorFiltro,
  cargoFiltro,
  setCargoFiltro,
  nivelFiltro,
  setNivelFiltro,
  mesAniversarioFiltro,
  setMesAniversarioFiltro,
  setFuncionariosFiltrados,
  setFiltroAtivo,
  inativos,
  mostrarFiltros,
  setMostrarFiltros,
}) {
  function definirFiltros() {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const getSexoNome = (x) => x.sexo_nome ?? "";
    const getNivelNome = (x) => x.nivel_nome ?? "";
    const getMesAniversario = (x) => x.mes_nome ?? "";

    const sexoSel = new Set(sexoFiltro.map(getSexoNome).filter(Boolean));
    const cargoSel = new Set(cargoFiltro.filter(Boolean));
    const setorSel = new Set(setorFiltro.filter(Boolean));
    const nivelSel = new Set(nivelFiltro.map(getNivelNome).filter(Boolean));
    const mesAniversarioSel = new Set(
      mesAniversarioFiltro.map(getMesAniversario).filter(Boolean)
    );

    const nomeBusca = (nomeFiltro || "").toLowerCase().trim();

    const filtrados = funcionarios.filter((f) => {
      const nomeFuncionario = f.funcionario_nome?.toLowerCase() || "";
      const sexoFuncionario = f.funcionario_sexo;
      const cargoFuncionario = f.cargo?.cargo_nome?.toLowerCase();
      const setorFuncionario = f.setor?.setor_nome?.toLowerCase();
      const nivelFuncionario = f.nivel?.nivel_nome?.toLowerCase();

      const data = f.funcionario_data_nascimento;
      let mesNome = "";
      if (data) {
        const partes = data.split("-");
        const mes = parseInt(partes[1], 10) - 1;
        mesNome = meses[mes] ?? "";
      }
      const mesAniversarioFuncionario = mesNome.toLowerCase();

      const nomeOk = nomeBusca === "" || nomeFuncionario.includes(nomeBusca);
      const sexoOk = sexoSel.size === 0 || sexoSel.has(sexoFuncionario);
      const cargoOk = cargoSel.size === 0 || cargoSel.has(cargoFuncionario);
      const setorOk = setorSel.size === 0 || setorSel.has(setorFuncionario);
      const nivelOk =
        nivelSel.size === 0 ||
        [...nivelSel].some((nivel) => nivelFuncionario.includes(nivel));
      const mesAniversarioOk =
        mesAniversarioSel.size === 0 ||
        [...mesAniversarioSel].some((mes) =>
          mesAniversarioFuncionario.includes(mes)
        );

      return nomeOk && sexoOk && cargoOk && setorOk && nivelOk && mesAniversarioOk;
    });

    const filtrosAtivos =
      nomeBusca !== "" ||
      sexoSel.size > 0 ||
      cargoSel.size > 0 ||
      setorSel.size > 0 ||
      nivelSel.size > 0 ||
      mesAniversarioSel.size > 0;
    if (typeof setFiltroAtivo === "function") setFiltroAtivo(filtrosAtivos);

    setFuncionariosFiltrados(filtrados);
  }
  useEffect(() => {
    definirFiltros();
  }, [
    funcionarios,
    nomeFiltro,
    sexoFiltro,
    cargoFiltro,
    setorFiltro,
    nivelFiltro,
    mesAniversarioFiltro,
  ]);

  function limparFiltro() {
    setNomeFiltro("");
    setSexoFiltro([]);
    setSetorFiltro([]);
    setCargoFiltro([]);
    setNivelFiltro([]);
    setMesAniversarioFiltro([]);
  }

  // Conta quantos filtros (exceto nome) estão ativos
  const filtrosExtrasAtivos = 
    sexoFiltro.length + 
    setorFiltro.length + 
    cargoFiltro.length + 
    nivelFiltro.length + 
    mesAniversarioFiltro.length;

  return (
    <div className="w-full rounded-lg transition-colors text-xl p-2">
      <div className="w-full flex gap-3 justify-center items-center">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={nomeFiltro}
            onChange={(e) => setNomeFiltro(e.target.value)}
            placeholder="Buscar por nome..."
            className="h-8 pl-8 pr-3 rounded-md border border-white/10 bg-white/5 text-white/90 text-[13px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors w-48"
          />
        </div>
        <button
          type="button"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[13px] leading-none tracking-tight focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors ${
            mostrarFiltros || filtrosExtrasAtivos > 0
              ? "border-blue-400/30 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25"
              : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
          }`}
          title="Mostrar/Esconder Filtros"
        >
          <SlidersHorizontal size={14} />
          Filtros
          {filtrosExtrasAtivos > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/30 text-[10px] text-blue-200">
              {filtrosExtrasAtivos}
            </span>
          )}
          {mostrarFiltros ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {mostrarFiltros && (
          <>
            <FiltroSexo
              funcionarioFiltro={sexoFiltro}
              setFuncionarioFiltro={setSexoFiltro}
            />
            <FiltroSetor
              funcionarios={funcionarios}
              funcionarioFiltro={setorFiltro}
              setFuncionarioFiltro={setSetorFiltro}
            />
            <FiltroCargo
              funcionarios={funcionarios}
              funcionarioFiltro={cargoFiltro}
              setFuncionarioFiltro={setCargoFiltro}
            />
            <FiltroNivel
              funcionarioFiltro={nivelFiltro}
              setFuncionarioFiltro={setNivelFiltro}
            />
            {inativos && (
              <FiltroMesAniversario
                funcionarioFiltro={mesAniversarioFiltro}
                setFuncionarioFiltro={setMesAniversarioFiltro}
              />
            )}
            <button
              type="button"
              onClick={limparFiltro}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-white/10 bg-white/5 text-white/90 text-[13px] leading-none tracking-tight hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
              title="Limpar Filtro"
            >
              Limpar Filtro
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default FiltrosFuncionarios;
