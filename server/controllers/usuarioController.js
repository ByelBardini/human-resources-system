import { Usuario } from "../models/index.js";
import bcrypt from "bcrypt";

export async function registrarUsuario(req, res) {
  const { usuario_nome, usuario_login, usuario_cadastrado_role } = req.body;
  const { usuario_role } = req.session.user;

  if (!usuario_role) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (usuario_role != "adm") {
    return res
      .status(403)
      .json({
        error:
          "Necessário ser um usuário administrador para realizar essa ação.",
      });
  }

  if (!usuario_nome || !usuario_login || !usuario_cadastrado_role) {
    res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }
  const senhaHash = bcrypt.hashSync("12345", 10);

  try {
    await Usuario.create({
      usuario_nome: usuario_nome,
      usuario_login: usuario_login,
      usuario_senha: senhaHash,
      usuario_role: usuario_cadastrado_role,
    });

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
}

export async function resetaSenhaUsuario(req, res) {
  const { id } = req.params;
  const { usuario_role } = req.session.user;

  if (!usuario_role) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (usuario_role != "adm") {
    return res
      .status(403)
      .json({
        error:
          "Necessário ser um usuário administrador para realizar essa ação.",
      });
  }
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

    res.status(200).json({ message: "Senha resetada com sucesso!" });
  } catch (err) {
    console.error("Erro ao resetar senha:", err);
    res.status(500).json({ error: "Erro ao resetar senha" });
  }
}

export async function trocaSenhaUsuario(req, res) {
  const { usuario_id } = req.session.user;
  const { nova_senha } = req.body;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  console.log(usuario_id, nova_senha);

  if (!nova_senha || !usuario_id) {
    res.status(400).json({ error: "Nova senha é obrigatória." });
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
          usuario_id: usuario_id,
        },
      }
    );

    res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error("Erro ao trocar senha:", err);
    res.status(500).json({ error: "Erro ao trocar senha" });
  }
}

export async function getUsuarios(req, res) {
  const { usuario_role } = req.session.user;

  if (!usuario_role) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (usuario_role != "adm") {
    return res
      .status(403)
      .json({
        error:
          "Necessário ser um usuário administrador para realizar essa ação.",
      });
  }
  try {
    const usuarios = await Usuario.findAll();

    if (usuarios.length == 0) {
      res.status(400).json({
        error: "Falha ao buscar usuários, fale com um administrador do sistema",
      });
    }

    res.status(200).json(usuarios);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

export async function inativaUsuario(req, res) {
  const { id } = req.params;
  const { usuario_role } = req.session.user;

  if (!usuario_role) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (usuario_role != "adm") {
    return res
      .status(403)
      .json({
        error:
          "Necessário ser um usuário administrador para realizar essa ação.",
      });
  }

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
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
    console.error("Erro ao inativar usuário:", err);
    res.status(500).json({ error: "Erro ao inativar usuário" });
  }
}
