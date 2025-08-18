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
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    throw error;
  }
}

export async function aumentoCargo(id_empresa, porcentagemAumento) {
  try {
    const response = await api.put("/cargos/aumento", {
      cargo_empresa_id: id_empresa,
      porcentagem: porcentagemAumento,
    });

    return response.sata;
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    throw error;
  }
}

export async function getCargos(id_empresa) {
  try {
    const response = await api.get(`/cargos/${id_empresa}`);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar cargos:", err);
    throw err;
  }
}

export async function deleteCargo(id_cargo) {
  try {
    const response = await api.delete(`cargos/${id_cargo}`);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar cargos:", err);
    throw err;
  }
}
