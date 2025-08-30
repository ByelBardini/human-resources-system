import { api } from "../api.js";
import { saveToken, clearToken } from "./authStore";

export async function logar(usuario_login, usuario_senha) {
  try {
    const response = await api.post(`/login`, {
      usuario_login,
      usuario_senha,
    });

    if (response.data?.token) await saveToken(response.data.token);

    return response.data;
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      const msg =
        (typeof data === "string" ? data : data?.error || data?.message) || "";
      if (msg) throw new Error(msg);

      if (err.response.status === 400)
        throw new Error("Preencha login e senha.");
      if (err.response.status === 401)
        throw new Error("Usuário ou senha incorretos.");
      if (err.response.status === 403)
        throw new Error("Usuário inativo ou sem permissão.");
      if (err.response.status === 404)
        throw new Error("Usuário não encontrado.");
      if (err.response.status === 500)
        throw new Error("Erro interno. Tente novamente.");
    }
    throw new Error("Falha de rede. Tente novamente.");
  }
}

export async function logout() {
  try {
    const response = await api.get(`/logout`);

    if (response) {
      localStorage.clear();
      await clearToken();
    }
  } catch (error) {
    console.error("Erro durante logout:", error);
  }
}
