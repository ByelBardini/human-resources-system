import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getFeriados() {
  try {
    const response = await api.get("/feriados");
    return response.data.feriados || [];
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar feriados");
  }
}

export async function getFeriadosNacionais() {
  try {
    const response = await api.get("/feriados/nacionais");
    return response.data.feriados || [];
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar feriados nacionais");
  }
}

export async function getFeriadosEmpresa(empresa_id) {
  try {
    const response = await api.get(`/feriados/empresa/${empresa_id}`);
    return response.data.feriados || [];
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar feriados da empresa");
  }
}

export async function criarFeriado(data) {
  try {
    const response = await api.post("/feriados", data);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao criar feriado");
  }
}

export async function atualizarFeriado(id, data) {
  try {
    const response = await api.put(`/feriados/${id}`, data);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao atualizar feriado");
  }
}

export async function excluirFeriado(id) {
  try {
    const response = await api.delete(`/feriados/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao excluir feriado");
  }
}
