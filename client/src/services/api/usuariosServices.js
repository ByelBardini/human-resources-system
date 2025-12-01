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

export async function getUsuariosFuncionarios(empresa_id = null) {
  try {
    const params = {};
    if (empresa_id) {
      params.empresa_id = empresa_id;
    }
    const response = await api.get("/usuario/funcionarios", { params });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionários:");
  }
}

export async function postUsuario(dados) {
  try {
    const response = await api.post("/usuario", dados);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao cadastrar usuário:");
  }
}

export async function getFuncionariosSemUsuario(empresa_id) {
  try {
    const response = await api.get("/usuario/funcionarios-sem-usuario", {
      params: { empresa_id },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionários sem usuário:");
  }
}

export async function atualizarCargoUsuario(id, usuario_cargo_id) {
  try {
    const response = await api.put(`/usuario/cargo/${id}`, {
      usuario_cargo_id,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao atualizar cargo do usuário:");
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
