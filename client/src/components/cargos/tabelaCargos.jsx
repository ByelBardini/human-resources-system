/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import HeaderProjecao from "./HeaderProjecao.jsx";
import CampoSalario from "./CampoSalario.jsx";
import IconeBotao from "../default/IconeBotao.jsx";

function TabelaCargos({
  cargos,
  selecionado,
  selecionaCampo,
  clicaDeleta,
  cargosFiltro,
  busca,
  setBusca,
}) {
  const [tabelaVazia, setTabelaVazia] = useState(false);
  const [cargosAtualizado, setCargosAtualizado] = useState([{ niveis: [] }]);

  function puxaDadosPesquisa() {
    if (cargosFiltro.length < 1) {
      if (cargos.length < 1) {
        setTabelaVazia(true);
      } else {
        setCargosAtualizado(cargos);
        setTabelaVazia(false);
      }
    } else {
      setCargosAtualizado(cargosFiltro);
      setTabelaVazia(false);
    }
  }

  useEffect(() => {
    puxaDadosPesquisa();
  }, [cargos, cargosFiltro]);

  return (
    <table className="min-w-[1100px] w-full text-sm border-collapse">
      <HeaderProjecao busca={busca} setBusca={setBusca} />

      {!tabelaVazia ? (
        <tbody className="text-white/90">
          {cargosAtualizado.map((cargo) => (
            <tr
              key={cargo.cargo_id}
              className={`
                border-b border-white/5 transition-colors cursor-pointer
                ${selecionado.linha == cargo.cargo_id
                  ? "bg-white/10"
                  : "hover:bg-white/5"
                }
              `}
              onClick={() => selecionaCampo(cargo.cargo_id, "")}
            >
              {/* Cargo */}
              <td className="px-4 py-3 align-middle w-[260px] min-w-[260px] max-w-[260px] border-r border-white/10 relative">
                {selecionado.linha == cargo.cargo_id && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <IconeBotao
                      tipo="deletar"
                      onClick={(e) => {
                        e.stopPropagation();
                        clicaDeleta(cargo.cargo_id);
                      }}
                    />
                  </div>
                )}
                <span 
                  className={`text-sm text-white/90 font-medium truncate block transition-all ${selecionado.linha == cargo.cargo_id ? 'pl-8' : ''}`} 
                  title={cargo.cargo_nome}
                >
                  {cargo.cargo_nome}
                </span>
              </td>

              {/* Níveis dinamicamente */}
              {cargo.niveis.map((nivel, index) => (
                <CampoSalario
                  key={`${cargo.cargo_id}-${index}`}
                  cargoNiveis={nivel}
                  cargoId={cargo.cargo_id}
                  selecionaCampo={selecionaCampo}
                  isLastJunior={index === 3}
                  isLastPleno={index === 6}
                />
              ))}
            </tr>
          ))}
        </tbody>
      ) : (
        <tbody>
          <tr>
            <td colSpan={11} className="px-6 py-16 text-center min-w-[1300px]">
              <div className="inline-flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-white/60">
                <SearchX size={20} className="opacity-70" />
                <span className="text-sm">Nenhuma função encontrada</span>
              </div>
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );
}

export default TabelaCargos;
