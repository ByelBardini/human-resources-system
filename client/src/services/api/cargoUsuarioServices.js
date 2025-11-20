import { api } from "../api.js";

export async function getCargosUsuarios() {
  try {
    const response = await api.get("/cargos-usuarios");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar cargos de usuários");
  }
}

export async function getCargoUsuario(id) {
  try {
    const response = await api.get(`/cargos-usuarios/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erro ao buscar cargo");
  }
}

export async function postCargoUsuario(data) {
  try {
    const response = await api.post("/cargos-usuarios", data);
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || "Erro ao criar cargo";
    const error = new Error(errorMessage);
    error.status = err.response?.status;
    throw error;
  }
}

export async function putCargoUsuario(id, data) {
  try {
    const response = await api.put(`/cargos-usuarios/${id}`, data);
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || "Erro ao atualizar cargo";
    const error = new Error(errorMessage);
    error.status = err.response?.status;
    throw error;
  }
}

export async function deleteCargoUsuario(id) {
  try {
    const response = await api.delete(`/cargos-usuarios/${id}`);
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || "Erro ao deletar cargo";
    const error = new Error(errorMessage);
    error.status = err.response?.status;
    throw error;
  }
}

