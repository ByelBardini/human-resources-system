import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getNotificacoes(id) {
  try {
    const response = await api.get(`/notificacoes/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar notificações:");
  }
}

export async function getNotificacoesMes(id, data_inicial, data_final) {
  try {
    const response = await api.get(`/notificacoes/mes/${id}`, {
      params: {
        data_inicial: data_inicial,
        data_final: data_final,
      },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar notificações:");
  }
}

export async function postNotificacao(id, payload, arquivoFile) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

  if (arquivoFile) {
    fd.append("arquivo", arquivoFile);
  }
  const { data } = await api.post(`/notificacoes/${id}`, fd);
  return data;
}
