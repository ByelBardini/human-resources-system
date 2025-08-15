import HeaderProjecao from "../cargos/HeaderProjecao.jsx";
import CampoSalario from "../cargos/CampoSalario.jsx";
import IconeBotao from "../default/IconeBotao.jsx";
import CampoTextoDinamico from "../cargos/CampoTextoDinamico.jsx";

function TabelaCargos({ cargos, selecionado, selecionaCampo, clicaDeleta }) {
  return (
    <table className="min-w-[1100px] w-full text-sm">
      <HeaderProjecao cargos={cargos} />

      <tbody className="divide-y divide-white/10 text-white/90">
        {cargos.map((cargo) => (
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
            <td className="px-4 py-2 align-top min-w-[260px] flex">
              <div className="flex gap-2 items-center ">
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

            {/* JUNIOR */}
            <CampoSalario
              cargoNiveis={cargo.niveis[0]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[1]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[2]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[3]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            {/* PLENO */}
            <CampoSalario
              cargoNiveis={cargo.niveis[4]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[5]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[6]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            {/* SENIOR */}
            <CampoSalario
              cargoNiveis={cargo.niveis[7]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[8]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />

            <CampoSalario
              cargoNiveis={cargo.niveis[9]}
              cargoId={cargo.cargo_id}
              campoSelecionado={selecionado.campo}
              selecionaCampo={selecionaCampo}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TabelaCargos;
