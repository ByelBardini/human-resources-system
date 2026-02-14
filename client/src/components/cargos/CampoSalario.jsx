function CampoSalario({
  cargoNiveis,
  cargoId,
  selecionaCampo,
  isLastJunior,
  isLastPleno,
}) {
  const borderCategory = isLastJunior || isLastPleno ? "border-r-2 border-white/25" : "border-r border-white/10";
  
  return (
    <td
      className={`px-3 py-3 min-w-[105px] text-center ${borderCategory}`}
      onClick={() => selecionaCampo(cargoId, cargoNiveis?.nivel_id)}
    >
      <span className="text-sm tabular-nums text-white/90">
        R$ {cargoNiveis?.nivel_salario.toLocaleString('pt-br', {minimumFractionDigits: 2}) || "0,00"}
      </span>
    </td>
  );
}
export default CampoSalario;
