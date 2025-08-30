import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getDescricoes(id) {
  try {
    const response = await api.get(`/descricoes/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar descricoes:");
  }
}

export async function putDescricao(
  id,
  descricao_setor_id,
  descricao_escolaridade,
  descricao_treinamento,
  descricao_comportamento,
  descricao_tecnica,
  descricao_experiencia,
  descricao_responsabilidade
) {
  try {
    const response = await api.put(`/descricoes/${id}`, {
      descricao_setor_id,
      descricao_escolaridade,
      descricao_treinamento,
      descricao_comportamento,
      descricao_tecnica,
      descricao_experiencia,
      descricao_responsabilidade,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar descricoes:");
  }
}
