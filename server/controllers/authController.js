import { Usuario } from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const CHAVE = process.env.SECRET_KEY_LOGIN;

export async function login(req, res) {
  const { usuario_login, usuario_senha } = req.body;

  if (!usuario_login || !usuario_senha) {
    return res.status(400).json({ error: "Login e senha são obrigatórios." });
  }

  try {
    const usuario = await Usuario.findOne({
      where: { usuario_login: usuario_login },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Login Incorreto" });
    }

    if (usuario.usuario_ativo == 0) {
      return res.status(403).json({ error: "Usuário inativo" });
    }

    const match = await bcrypt.compare(usuario_senha, usuario.usuario_senha);

    if (!match) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }
    const userSession = {
      usuario_id: usuario.usuario_id,
      usuario_role: usuario.usuario_role,
    };

    const resposta = {
      usuario_nome: usuario.usuario_nome,
      usuario_troca_senha: usuario.usuario_troca_senha,
      usuario_role: usuario.usuario_role,
    };

    const payload = {
      usuario_id: usuario.usuario_id,
      usuario_role: usuario.usuario_role,
    }

    const token = jwt.sign(payload, CHAVE, {
      expiresIn: "8h",
    });

    req.session.user = userSession;

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 8 * 60 * 60 * 1000, // 8 horas
      })
      .status(200)
      .json(resposta);
  } catch (err) {
    console.error("Erro na consulta:", err);
    return res.status(500).json({ error: "Erro ao validar usuário" });
  }
}

export const logout = async (req, res) => {
  if (req.session) req.session.destroy(() => {});
  res.clearCookie("token");
  return res.json({ mensagem: "Logout realizado com sucesso" });
};