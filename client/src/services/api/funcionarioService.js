import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getFuncionarios(id) {
  try {
    const response = await api.get(`/funcionario/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionarios:");
  }
}

export async function getFuncionariosInativos(id) {
  try {
    const response = await api.get(`/funcionario/inativos/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionarios:");
  }
}

export async function getFuncionarioFull(id) {
  try {
    const response = await api.get(`/funcionario/full/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionarios:");
  }
}

export async function postFuncionario(payload, fotoFile) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

  if (fotoFile) {
    fd.append("foto", fotoFile);
  }

  const { data } = await api.post("/funcionario", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return data;
}

export async function putFuncionario(id, payload, fotoFile) {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

  if (fotoFile) {
    fd.append("foto", fotoFile);
  }

  const { data } = await api.put(`/funcionario/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return data;
}

export async function getCargoSetor(id) {
  try {
    const response = await api.get(`/funcionario/cargo/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funções e setores:");
  }
}

export async function inativarFuncionario(id, data, comentario, preco) {
  try {
    const response = await api.put(`/funcionario/inativa/${id}`, {
      comentario: comentario,
      data_inativa: data,
      gasto_desligamento: preco,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao inativar funcionario");
  }
}
