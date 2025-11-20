import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function criarPerfilJornada(payload) {
  try {
    const response = await api.post("/perfil-jornada", payload);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao criar perfil de jornada:");
  }
}

export async function listarPerfisJornada() {
  try {
    const response = await api.get("/perfil-jornada");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao listar perfis de jornada:");
  }
}

export async function listarPerfisJornadaPublico() {
  try {
    const response = await api.get("/perfil-jornada/publico");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao listar perfis de jornada:");
  }
}

export async function vincularFuncionarioPerfil(funcionario_id, perfil_jornada_id) {
  try {
    const response = await api.post("/perfil-jornada/vincular", {
      funcionario_id,
      perfil_jornada_id,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao vincular funcionário ao perfil:");
  }
}

