function CampoSalario({
  cargoNiveis,
  cargoId,
  campoSelecionado,
  selecionaCampo,
  isLastJunior,
  isLastPleno,
}) {
  const isSelected = campoSelecionado == cargoNiveis?.nivel_id;
  const borderRight = isLastJunior || isLastPleno ? "border-r border-white/10" : "";
  
  return (
    <td
      className={`px-3 py-3 min-w-[105px] text-center cursor-default ${borderRight} ${isSelected ? "bg-white/10" : ""}`}
      onClick={() => selecionaCampo(cargoId, cargoNiveis?.nivel_id)}
    >
      <span className="text-sm tabular-nums text-white/90">
        R$ {cargoNiveis?.nivel_salario.toLocaleString('pt-br', {minimumFractionDigits: 2}) || "0,00"}
      </span>
    </td>
  );
}
export default CampoSalario;
