import { api } from "../api.js";

export async function getFuncionarios(id) {
  try {
    const response = await api.get(`/funcionario/${id}`);
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar funcionarios:", err);
    throw err;
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
