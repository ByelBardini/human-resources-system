import { api } from "../api.js";

export async function getUsuario() {
  try {
    const response = await api.get("/usuario");
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    throw err;
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
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    throw err;
  }
}

export async function inativaUsuario(id) {
  try {
    const response = await api.put(`/usuario/inativa/${id}`);
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao inativar/ativar usuário:", err);
    throw err;
  }
}

export async function resetaSenha(id) {
  try {
    const response = await api.put(`/usuario/resetasenha/${id}`);
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao resetar senha do usuário:", err);
    throw err;
  }
}

export async function trocaSenha(nova_senha) {
  try {
    const response = await api.put(`/usuario/trocasenha`, {
      nova_senha,
    });
    console.log(response);
    return response.data;
  } catch (err) {
    console.error("Erro ao trocar sua senha:", err);
    throw err;
  }
}
