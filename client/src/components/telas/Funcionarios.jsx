import { useState } from "react";
import TabelaFuncionarios from "../funcionarios/TabelaFuncionarios.jsx";

function Funcionarios({
  setAdicionandoFunc,
  setCardFuncionario,
  modificado,
  setModificado,
}) {
  const [funcionarios, setFuncionarios] = useState([]);

  const [totalSalario, setTotalSalario] = useState(0);

  return (
    <div className="min-w-[1100px] w-full h-full">
      <div className="rounded-lg border border-white/10 transition-colors text-xl bg-white/5 backdrop-blur-xl p-2">
        <div className="w-full flex gap-3 justify-center">
          <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
            Sexo
          </div>
          <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
            Setor
          </div>
          <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
            Função
          </div>
          <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
            Nível
          </div>
          <div className="p-2 rounded-lg border border-white/10 transition-colors text-xl bg-white/5">
            Aniversariantes do mês
          </div>
        </div>
        <div className="mt-3 text-center font-bold">
          Total por mês: R${" "}
          {totalSalario.toLocaleString("pt-br", {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>
      <div className="mt-5 min-w-[1100px] relative w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
        <TabelaFuncionarios
          setCardFuncionario={setCardFuncionario}
          funcionarios={funcionarios}
          setFuncionarios={setFuncionarios}
          totalSalario={totalSalario}
          setTotalSalario={setTotalSalario}
          setModificado={setModificado}
          modificado={modificado}
        />
      </div>
      <div className="mt-5 flex justify-center gap-6">
        <button
          onClick={() => setAdicionandoFunc(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
        >
          Adicionar Funcionário
        </button>
      </div>
    </div>
  );
}

export default Funcionarios;
