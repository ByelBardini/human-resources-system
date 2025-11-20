import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getRelatorioMensal(mes, ano) {
  try {
    const response = await api.get("/relatorio/mensal", {
      params: { mes, ano },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar relatório mensal:");
  }
}

export async function getTotaisMensais(mes, ano) {
  try {
    const response = await api.get("/relatorio/totais", {
      params: { mes, ano },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar totais mensais:");
  }
}

