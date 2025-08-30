import { api } from "../api.js";
import { saveToken, clearToken } from "./authStore";
import { handleApiError } from "../api/handleApiError.js";

export async function logar(usuario_login, usuario_senha) {
  try {
    const response = await api.post(`/login`, {
      usuario_login,
      usuario_senha,
    });

    if (response.data?.token) await saveToken(response.data.token);

    return response.data;
  } catch (err) {
    const { status } = handleApiError(err, "Erro ao fazer login");

    if (status === 400) throw new Error("Login e senha obrigatórios.");
    if (status === 401) throw new Error("Usuário ou senha incorretos.");
    if (status === 403) throw new Error("Usuário inativo ou sem permissão para acessar o sistema.");
    if (status === 409) throw new Error("Conflito de dados.");
    if (status === 500) throw new Error("Erro interno. Tente novamente mais tarde.");

  }
}

export async function logout() {
  try {
    const response = await api.get(`/logout`);

    if (response) {
      localStorage.clear();
      await clearToken();
    }
  } catch (err) {
    const {message} = handleApiError(err, "Erro durante logout.")
    console.error(message);
  }
}
