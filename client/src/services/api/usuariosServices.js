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
