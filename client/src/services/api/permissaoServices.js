import { api } from "../api.js";

export async function getPermissoes() {
  try {
    const response = await api.get("/permissoes");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar permissões");
  }
}

export async function getPermissao(id) {
  try {
    const response = await api.get(`/permissoes/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar permissão");
  }
}

export async function getPermissoesCargo(cargoId) {
  try {
    const response = await api.get(`/permissoes/cargo/${cargoId}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar permissões do cargo");
  }
}

export async function getPermissoesAgrupadas() {
  try {
    const response = await api.get("/permissoes/agrupadas");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar permissões agrupadas");
  }
}

