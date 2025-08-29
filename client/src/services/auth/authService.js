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
    if (err.response && err.response.status === 400) {
      throw new Error(err.response.data?.error || "Preencha login e senha.");
    } else if (err.response && err.response.status === 401) {
      throw new Error(
        err.response.data?.error || "Usuário ou senha incorretos."
      );
    } else if (err.response && err.response.status === 403) {
      throw new Error(
        err.response.data?.error ||
          "Usuário inativo ou sem permissão para acessar o sistema."
      );
    } else if (err.response && err.response.status === 500) {
      throw new Error(
        err.response.data?.error || "Erro interno. Tente novamente mais tarde."
      );
    }
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