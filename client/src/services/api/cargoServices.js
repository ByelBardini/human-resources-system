import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function postCargos(
  id_empresa,
  cargo_nome,
  cargo_salario_inicial
) {
  try {
    const response = await api.post("/cargos", {
      cargo_empresa_id: id_empresa,
      cargo_nome: cargo_nome,
      salario_inicial: cargo_salario_inicial,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao criar cargo:");
  }
}

export async function aumentoCargo(id_empresa, porcentagemAumento) {
  try {
    const response = await api.put("/cargos/aumento", {
      cargo_empresa_id: id_empresa,
      porcentagem: porcentagemAumento,
    });
    return response.sata;
  } catch (err) {
    throw handleApiError(err, "Erro ao aumentar salário:");
  }
}

export async function getCargos(id_empresa) {
  try {
    const response = await api.get(`/cargos/${id_empresa}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar cargos:");
  }
}

export async function deleteCargo(id_cargo) {
  try {
    const response = await api.delete(`cargos/${id_cargo}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao deletar cargos:");
  }
}
