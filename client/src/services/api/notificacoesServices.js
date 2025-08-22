import { api } from "../api.js";

export async function getNotificacoes(id) {
  try {
    const response = await api.get(`/notificacoes/${id}`);
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    throw err;
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
