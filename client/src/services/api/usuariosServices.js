import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getUsuario() {
  try {
    const response = await api.get("/usuario");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar usuários:");
  }
}

export async function postUsuario(
  usuario_nome,
  usuario_login,
  usuario_cadastrado_role
) {
  try {
    const response = await api.post("/usuario", {
      usuario_nome,
      usuario_login,
      usuario_cadastrado_role,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao cadastrar usuário:");
  }
}

export async function inativaUsuario(id) {
  try {
    const response = await api.put(`/usuario/inativa/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao inativar/ativar usuário:");
  }
}

export async function resetaSenha(id) {
  try {
    const response = await api.put(`/usuario/resetasenha/${id}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao resetar senha do usuário:");
  }
}

export async function trocaSenha(nova_senha) {
  try {
    const response = await api.put(`/usuario/trocasenha`, {
      nova_senha,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao trocar sua senha:");
  }
}
