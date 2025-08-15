function CampoSalario({
  cargoNiveis,
  cargoId,
  campoSelecionado,
  selecionaCampo,
}) {
  return (
    <td className="px-2 py-2">
      <input
        value={`R$ ${cargoNiveis?.nivel_salario.toFixed(2) || ""}`}
        readOnly
        className={
          campoSelecionado == cargoNiveis?.nivel_id
            ? "cursor-default w-full bg-transparent focus:bg-white/30 outline-none px-2 py-2 rounded-lg border border-white/30"
            : "cursor-default w-full bg-transparent focus:bg-white/10 outline-none px-2 py-2 rounded-lg border border-white/10"
        }
        onClick={() => selecionaCampo(cargoId, cargoNiveis?.nivel_id)}
      />
    </td>
  );
}
export default CampoSalario;
