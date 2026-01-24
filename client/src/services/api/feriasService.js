import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getFerias(params = {}) {
  try {
    const response = await api.get("/ferias", { params });
    return response.data.ferias || [];
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar férias");
  }
}

export async function getUsuariosFerias(empresa_id = null) {
  try {
    const params = {};
    if (empresa_id) {
      params.empresa_id = empresa_id;
    }
    const response = await api.get("/ferias/usuarios", { params });
    return response.data.usuarios || [];
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar usuários");
  }
}

export async function criarFerias(data) {
  try {
    const response = await api.post("/ferias", data);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao criar férias");
  }
}

export async function atualizarFerias(id, data) {
  try {
    const response = await api.put(`/ferias/${id}`, data);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao atualizar férias");
  }
}

export async function cancelarFerias(id) {
  try {
    const response = await api.delete(`/ferias/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao cancelar férias");
  }
}
