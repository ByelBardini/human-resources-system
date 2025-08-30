/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import HeaderProjecao from "./HeaderProjecao.jsx";
import CampoSalario from "./CampoSalario.jsx";
import IconeBotao from "../default/IconeBotao.jsx";
import CampoTextoDinamico from "./CampoTextoDinamico.jsx";

function TabelaCargos({
  cargos,
  selecionado,
  selecionaCampo,
  clicaDeleta,
  cargosFiltro,
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
    <table className="min-w-[1100px] w-full text-sm">
      <HeaderProjecao cargos={cargos} />

      {!tabelaVazia ? (
        <tbody className="divide-y divide-white/10 text-white/90">
          {cargosAtualizado.map((cargo) => (
            <tr
              key={cargo.cargo_id}
              className={
                selecionado.linha == cargo.cargo_id
                  ? "bg-white/10 hover:bg-white/15 transition-colors"
                  : "hover:bg-white/5 transition-colors"
              }
              onClick={() => selecionaCampo(cargo.cargo_id, "")}
            >
              {/* Cargo */}
              <td className="px-4 py-2 align-top min-w-[220px] flex">
                <div className="flex gap-2 items-center">
                  {selecionado.linha == cargo.cargo_id && (
                    <div className="w-[88px] flex flex-col gap-2">
                      <IconeBotao
                        tipo="deletar"
                        onClick={() => clicaDeleta(cargo.cargo_id)}
                      />
                    </div>
                  )}
                  <CampoTextoDinamico
                    value={cargo.cargo_nome}
                    onClick={() => selecionaCampo(cargo.cargo_id, "")}
                  />
                </div>
              </td>

              {/* Níveis dinamicamente */}
              {cargo.niveis.map((nivel, index) => (
                <CampoSalario
                  key={`${cargo.cargo_id}-${index}`}
                  cargoNiveis={nivel}
                  cargoId={cargo.cargo_id}
                  campoSelecionado={selecionado.campo}
                  selecionaCampo={selecionaCampo}
                />
              ))}
            </tr>
          ))}
        </tbody>
      ) : (
        <tbody>
          <tr>
            <td colSpan={11} className="px-6 py-10 text-center min-w-[1300px]">
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/70">
                <SearchX size={16} className="opacity-80" />
                Nenhuma função encontrada
              </div>
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );
}

export default TabelaCargos;
