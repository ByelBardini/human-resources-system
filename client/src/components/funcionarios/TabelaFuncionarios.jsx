/* eslint-disable react-hooks/exhaustive-deps */
import { useAviso } from "../../context/AvisoContext.jsx";
import { useAuthError } from "../../hooks/useAuthError.js";
import logger from "../../utils/logger.js";
import { useState } from "react";
import {
  getFuncionarios,
  getFuncionariosInativos,
} from "../../services/api/funcionarioService.js";
import {
  Mars,
  Venus,
  ArrowDownZA,
  ArrowUpAZ,
  ArrowUp10,
  ArrowUp01,
} from "lucide-react";
import { useEffect } from "react";

function TabelaFuncionarios({
  setCardFuncionario,
  setFuncionarios,
  funcionarios,
  modificado,
  setModificado,
  inativos,
  navigate,
}) {
  const { mostrarAviso } = useAviso();
  const { handleAuthError, isAuthError } = useAuthError();
  const [clicado, setClicado] = useState("");
  const [nomeSort, setNomeSort] = useState(false);
  const [salarioSort, setSalarioSort] = useState(false);
  const [nascimentoSort, setNascimentoSort] = useState(false);
  const [admissaoSort, setAdmissaoSort] = useState(false);

  function ordenarPorNome() {
    const ordenado = [...funcionarios].sort((a, b) => {
      if (nomeSort) {
        return a.funcionario_nome.localeCompare(b.funcionario_nome);
      } else {
        return b.funcionario_nome.localeCompare(a.funcionario_nome);
      }
    });
    setFuncionarios(ordenado);
    setNomeSort(!nomeSort);
  }
  function ordenarPorSalario() {
    const ordenado = [...funcionarios].sort((a, b) => {
      if (salarioSort) {
        return a.nivel.nivel_salario - b.nivel.nivel_salario;
      } else {
        return b.nivel.nivel_salario - a.nivel.nivel_salario;
      }
    });
    setFuncionarios(ordenado);
    setSalarioSort(!salarioSort);
  }

  function ordenarPorNascimento() {
    const ordenado = [...funcionarios].sort((a, b) => {
      const dataA = new Date(a.funcionario_data_nascimento);
      const dataB = new Date(b.funcionario_data_nascimento);

      return nascimentoSort ? dataA - dataB : dataB - dataA;
    });

    setFuncionarios(ordenado);
    setNascimentoSort(!nascimentoSort);
  }

  function ordenarPorAdmissao() {
    const ordenado = [...funcionarios].sort((a, b) => {
      const dataA = new Date(a.funcionario_data_admissao);
      const dataB = new Date(b.funcionario_data_admissao);

      return admissaoSort ? dataA - dataB : dataB - dataA;
    });

    setFuncionarios(ordenado);
    setAdmissaoSort(!admissaoSort);
  }

  function abreCard(id) {
    localStorage.setItem("funcionario_id", id);
    setCardFuncionario(true);
  }

  function selecionaCampo(id) {
    if (clicado === id) {
      setClicado(0);
    } else {
      setClicado(id);
    }
  }

  function calcularTempoAdmissao(
    inativos,
    funcionario_data_admissao,
    funcionario_data_desligamento
  ) {
    const hoje = inativos
      ? new Date()
      : new Date(funcionario_data_desligamento);
    const admissao = new Date(funcionario_data_admissao);

    let anos = hoje.getFullYear() - admissao.getFullYear();
    let meses = hoje.getMonth() - admissao.getMonth();
    let dias = hoje.getDate() - admissao.getDate();

    if (dias < 0) {
      meses--;
      const ultimoMes = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        0
      ).getDate();
      dias += ultimoMes;
    }
    if (meses < 0) {
      anos--;
      meses += 12;
    }
    if (anos > 0) {
      return anos === 1 ? `${anos} ano` : `${anos} anos`;
    } else if (meses > 0) {
      return meses === 1 ? `${meses} mês` : `${meses} meses`;
    } else {
      return dias === 1 ? `${dias} dia` : `${dias} dias`;
    }
  }

  function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }

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

    const parsed = new Date(s);
    return isNaN(parsed) ? s : parsed.toLocaleDateString("en-GB");
  }

  async function puxarFuncionarios() {
    const id = localStorage.getItem("empresa_id");
    try {
      const funcionarios = inativos
        ? await getFuncionarios(id)
        : await getFuncionariosInativos(id);
      setFuncionarios(funcionarios);
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError();
        logger.log(err);
      } else {
        logger.error("Erro ao buscar cargos:", err);
      }
    }
  }

  useEffect(() => {
    puxarFuncionarios();
    setModificado(false);
  }, [modificado, inativos]);

  return (
    <table className="table-fixed w-full text-sm text-white/90">
      <thead className="bg-white/10 text-white/80">
        <tr className="divide-x divide-white/10">
          <th className="px-4 py-3 text-left font-medium w-[250px]">
            <div className="flex items-center justify-between">
              Nome
              <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30" onClick={ordenarPorNome}>
                {nomeSort ? (
                  <ArrowDownZA size={18} strokeWidth={2.2} />
                ) : (
                  <ArrowUpAZ size={18} strokeWidth={2.2} />
                )}
              </button>
            </div>
          </th>
          <th className="px-4 py-3 font-medium w-[65px]">Sexo</th>
          <th className="px-4 py-3 font-medium w-[130px]">Setor</th>
          <th className="px-4 py-3 font-medium w-[150px]">Função</th>
          <th className="px-4 py-3 font-medium w-[90px]">Nível</th>
          {inativos ? (
            <th className="px-4 py-3 font-medium w-[130px]">
              <div className="flex justify-between">
                Salário
                <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30" onClick={ordenarPorSalario}>
                  {salarioSort ? (
                    <ArrowUp10 size={18} strokeWidth={2.2} />
                  ) : (
                    <ArrowUp01 size={18} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </th>
          ) : (
            <th className="px-4 py-3 font-medium w-[130px]">
              <div className="flex justify-between">
                Gasto
                <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30" onClick={ordenarPorSalario}>
                  {salarioSort ? (
                    <ArrowUp10 size={18} strokeWidth={2.2} />
                  ) : (
                    <ArrowUp01 size={18} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </th>
          )}
          {inativos && (
            <th className="px-4 py-3 font-medium w-[95px]">
              <div className="flex justify-between">
                Idade
                <button
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  onClick={ordenarPorNascimento}
                >
                  {nascimentoSort ? (
                    <ArrowUp10 size={18} strokeWidth={2.2} />
                  ) : (
                    <ArrowUp01 size={18} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </th>
          )}
          {inativos ? (
            <th className="px-4 py-3 font-medium w-[130px]">Nascimento</th>
          ) : (
            <th className="px-4 py-3 font-medium w-[130px]">Desligamento</th>
          )}
          <th className="px-4 py-3 font-medium w-[140px]">
            <div className="flex justify-between">
              Admitido hà:
              <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30" onClick={ordenarPorAdmissao}>
                {admissaoSort ? (
                  <ArrowUp10 size={18} strokeWidth={2.2} />
                ) : (
                  <ArrowUp01 size={18} strokeWidth={2.2} />
                )}
              </button>
            </div>
          </th>
          <th className="px-4 py-3 font-medium w-[130px]">Admissão</th>
        </tr>
      </thead>
      <tbody className="min-w-[1100px] w-full divide-y divide-white/10">
        {funcionarios.map((funcionario) => (
          <tr
            onDoubleClick={() => abreCard(funcionario.funcionario_id)}
            key={funcionario.funcionario_id}
            onClick={() => selecionaCampo(funcionario.funcionario_id)}
            className={
              clicado === funcionario.funcionario_id
                ? "bg-white/8 hover:bg-white/12 transition-colors"
                : "hover:bg-white/3 transition-colors"
            }
          >
            <td className="px-4 py-2 w-[150px] whitespace-normal break-words">
              {funcionario.funcionario_nome || ""}
            </td>
            <td className="px-4 py-2 w-[185px] justify-items-center">
              {funcionario.funcionario_sexo === "masculino" ? (
                <Mars className="text-blue-600" />
              ) : (
                <Venus className="text-pink-600" />
              )}
            </td>
            <td className="px-4 py-2 w-[150px] text-center">
              {funcionario.setor.setor_nome || ""}
            </td>
            <td className="px-4 py-2 w-[150px] text-center">
              {funcionario.cargo.cargo_nome || ""}
            </td>
            <td className="px-4 py-2 w-[90px] text-center">
              {funcionario.nivel.nivel_nome || ""}
            </td>
            {inativos ? (
              <td className="px-4 py-2 w-[110px] text-center">
                R$
                {funcionario.nivel.nivel_salario.toLocaleString("pt-br", {
                  minimumFractionDigits: 2,
                }) || ""}
              </td>
            ) : (
              <td className="px-4 py-2 w-[110px] text-center">
                R$
                {Number(
                  funcionario.funcionario_gasto_desligamento
                ).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                }) || ""}
              </td>
            )}
            {inativos ? (
              <td className="px-4 py-2 w-[100px] text-center">
                {calcularIdade(funcionario.funcionario_data_nascimento)} Anos
              </td>
            ) : (
              <td className="px-4 py-2 w-[100px] text-center">
                {formatarData(funcionario.funcionario_data_desligamento)}
              </td>
            )}
            {inativos && (
              <td className="px-4 py-2 whitespace-nowrap text-center">
                {formatarData(funcionario.funcionario_data_nascimento) || ""}
              </td>
            )}
            <td className="px-4 py-2 w-[170px] text-center">
              {calcularTempoAdmissao(
                inativos,
                funcionario.funcionario_data_admissao,
                funcionario.funcionario_data_desligamento
              )}
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-center">
              {formatarData(funcionario.funcionario_data_admissao) || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TabelaFuncionarios;
