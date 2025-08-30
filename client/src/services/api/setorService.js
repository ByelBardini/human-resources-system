import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getSetores(id) {
  try {
    const response = await api.get(`/setor/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar setores");
  }
}
