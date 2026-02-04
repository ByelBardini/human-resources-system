import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function criarJustificativa(payload, anexoFile) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

  if (anexoFile) {
    fd.append("anexo", anexoFile);
  }

  try {
    const response = await api.post("/justificativa", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao criar justificativa:");
  }
}

export async function listarJustificativas(mes, ano) {
  try {
    const response = await api.get("/justificativa", {
      params: { mes, ano },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao listar justificativas:");
  }
}

export async function aprovarJustificativa(id, dados = {}) {
  try {
    const response = await api.put(`/justificativa/aprovar/${id}`, dados);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao aprovar justificativa:");
  }
}

export async function recusarJustificativa(id) {
  try {
    const response = await api.put(`/justificativa/recusar/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao recusar justificativa:");
  }
}

