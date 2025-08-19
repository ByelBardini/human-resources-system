import { api } from "../api.js";

export async function getSetores(id) {
  try {
    const response = await api.get(`/setor/${id}`);
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar setores:", err);
    throw err;
  }
}
