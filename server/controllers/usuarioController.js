import { Usuario } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import bcrypt from "bcrypt";

function requireUser(req) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized(
      "Necessário estar logado para realizar operações."
    );
  }
  return usuario;
}

function requireAdmin(req) {
  const usuario = requireUser(req);
  if (usuario.usuario_role !== "adm") {
    throw ApiError.forbidden(
      "Necessário ser um usuário administrador para realizar essa ação."
    );
  }
  return usuario;
}

export async function registrarUsuario(req, res) {
  const { usuario_nome, usuario_login, usuario_cadastrado_role } = req.body;
  requireAdmin(req);

  if (!usuario_nome || !usuario_login || !usuario_cadastrado_role) {
    throw ApiError.badRequest("Todos os campos são obrigatórios.");
  }

  const senhaHash = bcrypt.hashSync("12345", 10);

  try {
    await Usuario.create({
      usuario_nome,
      usuario_login,
      usuario_senha: senhaHash,
      usuario_role: usuario_cadastrado_role,
    });

    return res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    throw ApiError.internal("Erro ao registrar usuário");
  }
}

export async function resetaSenhaUsuario(req, res) {
  const { id } = req.params;
  requireAdmin(req);

  const nova_senha = bcrypt.hashSync("12345", 10);

  try {
    await Usuario.update(
      {
        usuario_senha: nova_senha,
        usuario_troca_senha: 1,
      },
      {
        where: {
          usuario_id: id,
        },
      }
    );

    return res.status(200).json({ message: "Senha resetada com sucesso!" });
  } catch (err) {
    console.error("Erro ao resetar senha:", err);
    throw ApiError.internal("Erro ao resetar senha");
  }
}

export async function trocaSenhaUsuario(req, res) {
  const { usuario_id } = requireUser(req);
  const { nova_senha } = req.body;

  if (!nova_senha) {
    throw ApiError.badRequest("Nova senha é obrigatória.");
  }

  const senhaHash = bcrypt.hashSync(nova_senha, 10);

  try {
    await Usuario.update(
      {
        usuario_senha: senhaHash,
        usuario_troca_senha: 0,
      },
      {
        where: {
          usuario_id,
        },
      }
    );

    return res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error("Erro ao trocar senha:", err);
    throw ApiError.internal("Erro ao trocar senha");
  }
}

export async function getUsuarios(req, res) {
  requireAdmin(req);

  try {
    const usuarios = await Usuario.findAll({
      order: [["usuario_nome", "ASC"]],
    });

    if (!usuarios || usuarios.length === 0) {
      throw ApiError.notFound(
        "Falha ao buscar usuários, fale com um administrador do sistema"
      );
    }

    return res.status(200).json(usuarios);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar usuários:", err);
    throw ApiError.internal("Erro ao buscar usuários");
  }
}

export async function inativaUsuario(req, res) {
  const { id } = req.params;
  requireAdmin(req);

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      throw ApiError.notFound("Usuário não encontrado");
    }
    usuario.usuario_ativo =
      !usuario.usuario_ativo || usuario.usuario_ativo === 0 ? 1 : 0;
    await usuario.save();

    return res.status(200).json({
      message: usuario.usuario_ativo
        ? "Usuário Ativado."
        : "Usuário Inativado.",
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao inativar usuário:", err);
    throw ApiError.internal("Erro ao inativar usuário");
  }
}
