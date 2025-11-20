import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function registrarBatida() {
  try {
    const response = await api.post("/ponto/registrar");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao registrar batida:");
  }
}

export async function getPontoHoje() {
  try {
    const response = await api.get("/ponto/hoje");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar ponto do dia:");
  }
}

export async function getBatidasDia(data) {
  try {
    const response = await api.get("/ponto/batidas", {
      params: { data },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar batidas do dia:");
  }
}

