import { api } from "../api.js";

const MENSAGENS_POR_STATUS = {
  400: "Preencha login e senha.",
  401: "Usuário ou senha incorretos.",
  403: "Usuário inativo ou sem permissão.",
  404: "Usuário não encontrado.",
  500: "Erro interno. Tente novamente.",
};

export async function logar(usuario_login, usuario_senha) {
  try {
    const response = await api.post("/login", {
      usuario_login,
      usuario_senha,
    });

    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (err) {
    // Interceptor da api rejeita com { status, message }; axios bruto tem err.response
    const status = err.status ?? err.response?.status;
    const msg =
      err.message ||
      (err.response?.data && typeof err.response.data === "string"
        ? err.response.data
        : err.response?.data?.error || err.response?.data?.message);

    if (msg) throw new Error(msg);
    throw new Error(MENSAGENS_POR_STATUS[status] ?? "Falha de rede. Tente novamente.");
  }
}
