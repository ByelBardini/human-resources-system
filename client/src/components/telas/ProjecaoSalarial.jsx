import { useEffect, useState } from "react";
import { getCargos, deleteCargo } from "../../services/api/cargoServices.js";
import HeaderProjecao from "../cargos/HeaderProjecao.jsx";
import CampoSalario from "../cargos/CampoSalario.jsx";
import IconeBotao from "../default/IconeBotao.jsx";
import CampoTextoDinamico from "../cargos/CampoTextoDinamico.jsx"

export default function ProjecaoSalarial({
  setAdicionando,
  setConfirmacao,
  setTextoConfirmacao,
  setOnSimConfirmacao,
  setCorAviso,
  setTextoAviso,
  setAviso,
}) {
  const [cargos, setCargos] = useState([{ niveis: [] }]);

  const [selecionado, setSelecionado] = useState({ linha: null, campo: null });

  function clicaDeleta(id) {
    setConfirmacao(true);
    setTextoConfirmacao(
      "Você tem certeza que deseja excluir esse cargo? Essa ação é irreversível"
    );
    setOnSimConfirmacao(() => () => deletaCargo(id));
  }

  async function deletaCargo(id) {
    try {
      await deleteCargo(id);
      setConfirmacao(false);
      setCorAviso("verde");
      setTextoAviso("Cargo excluído com sucesso!");
      setAviso(true);
      setTimeout(() => {
        setAviso(false);
        buscaCargos();
      }, 500);
    } catch (err) {
      setConfirmacao(false);
      console.error("Erro ao deletar cargo:", err);
      setCorAviso("vermelho");
      setTextoAviso("Erro ao deletar cargo:", err.message || err);
      setAviso(true);
    }
  }

  function selecionaCampo(cargoId, campoId) {
    setSelecionado(
      (prev) =>
        prev.linha === cargoId && prev.campo === campoId
          ? { linha: null, campo: null } // desmarca
          : { linha: cargoId, campo: campoId } // marca
    );
  }

  async function buscaCargos() {
    const empresa_id = localStorage.getItem("empresa_id");

    try {
      const cargos = await getCargos(empresa_id);
      console.log(cargos);
      setCargos(cargos);
    } catch (err) {
      console.error("Erro ao buscar cargos:", err);
    }
  }

  useEffect(() => {
    buscaCargos();
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div className="relative w-full h-full min-h-0 overflow-auto rounded-xl border border-white/10 bg-white/5/50 backdrop-blur-xl shadow-xl">
        <table className="min-w-[1100px] w-full text-sm">
          <HeaderProjecao />

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
      </div>

      {/* Ações */}
      <div className="flex justify-center">
        <button
          onClick={() => setAdicionando(true)}
          className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow"
        >
          Adicionar Cargo
        </button>
      </div>
    </div>
  );
}
