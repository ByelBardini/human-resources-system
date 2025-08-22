/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { getFuncionarios } from "../../services/api/funcionarioService.js";
import { Mars, Venus, ExternalLink } from "lucide-react";
import { useEffect } from "react";

function TabelaFuncionarios({ setFuncionarios, funcionarios }) {
  const [clicado, setClicado] = useState("");

  function selecionaCampo(id) {
    if (clicado == id) {
      setClicado(0);
    } else {
      setClicado(id);
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
      const funcionarios = await getFuncionarios(id);
      setFuncionarios(funcionarios);
    } catch (err) {
      console.error("Erro ao buscar cargos:", err);
    }
  }

  useEffect(() => {
    puxarFuncionarios();
  }, []);

  return (
    <table className="min-w-[1100px] w-full text-sm text-white/90">
      <thead className="bg-white/10 text-white/80">
        <tr className="divide-x divide-white/10">
          <th className="px-4 py-3 text-left font-medium">Nome</th>
          <th className="px-4 py-3 text-left font-medium">Sexo</th>
          <th className="px-4 py-3 text-left font-medium">Setor</th>
          <th className="px-4 py-3 text-left font-medium">Função</th>
          <th className="px-4 py-3 text-left font-medium">Nível</th>
          <th className="px-4 py-3 text-left font-medium">Salário</th>
          <th className="px-4 py-3 text-left font-medium">Idade</th>
          <th className="px-4 py-3 text-left font-medium">
            Data de Nascimento
          </th>
          <th className="px-4 py-3 text-left font-medium">Anos de empresa</th>
          <th className="px-4 py-3 text-left font-medium">Data de admissão</th>
        </tr>
      </thead>
      <tbody className="min-w-[1100px] w-full divide-y divide-white/10">
        {funcionarios.map((funcionario) => (
          <tr
            onDoubleClick={() => alert()}
            key={funcionario.funcionario_id}
            onClick={() => selecionaCampo(funcionario.funcionario_id)}
            className={
              clicado == funcionario.funcionario_id
                ? "bg-white/8 hover:bg-white/12 transition-colors"
                : "hover:bg-white/3 transition-colors"
            }
          >
            <td className="px-4 py-2 text- flex gap-2 w-[250px]">
              {funcionario.funcionario_nome || ""}
            </td>
            <td className="px-4 py-2 items-center w-[65px] ">
              {funcionario.funcionario_sexo == "masculino" ? (
                <Mars className="text-blue-600" />
              ) : (
                <Venus className="text-pink-600" />
              )}
            </td>
            <td className="px-4 py-2 align-top w-[150px] text-center">
              {funcionario.setor.setor_nome || ""}
            </td>
            <td className="px-4 py-2 align-top w-[150px]">
              {funcionario.cargo.cargo_nome || ""}
            </td>
            <td className="px-4 py-2 align-top w-[20]">
              {funcionario.nivel.nivel_nome || ""}
            </td>
            <td className="px-4 py-2 align-top">
              R${" "}
              {funcionario.nivel.nivel_salario.toLocaleString("pt-br", {
                minimumFractionDigits: 2,
              }) || ""}
            </td>
            <td className="px-4 py-2 align-top">
              {calcularIdade(funcionario.funcionario_data_nascimento)} Anos
            </td>
            <td className="px-4 py-2 align-top whitespace-nowrap">
              {formatarData(funcionario.funcionario_data_nascimento) || ""}
            </td>
            <td className="px-4 py-2 align-top">
              {calcularIdade(funcionario.funcionario_data_admissao)} Anos
            </td>
            <td className="px-4 py-2 align-top whitespace-nowrap">
              {formatarData(funcionario.funcionario_data_admissao) || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TabelaFuncionarios;
