import { Usuario, CargoUsuario, Permissao, Empresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const CHAVE = process.env.SECRET_KEY_LOGIN;

export async function login(req, res) {
  const { usuario_login, usuario_senha } = req.body;

  if (!usuario_login || !usuario_senha) {
    throw ApiError.badRequest("Login e senha obrigatórios.");
  }

  try {
    const usuario = await Usuario.findOne({
      where: { usuario_login: usuario_login },
      include: [
        {
          model: CargoUsuario,
          as: "cargo",
          include: [
            {
              model: Permissao,
              as: "permissoes",
            },
            {
              model: Empresa,
              as: "empresas",
            },
          ],
        },
      ],
    });

    if (!usuario) {
      throw ApiError.unauthorized("Login incorreto.");
    }

    if (usuario.usuario_ativo == 0) {
      throw ApiError.unauthorized("Usuário inativo.");
    }

    if (!usuario.cargo || usuario.cargo.cargo_usuario_ativo === 0) {
      throw ApiError.unauthorized("Cargo do usuário está inativo.");
    }

    const match = await bcrypt.compare(usuario_senha, usuario.usuario_senha);

    if (!match) {
      throw ApiError.unauthorized("Senha incorreta.");
    }

    // Extrair códigos das permissões
    const permissoes = usuario.cargo.permissoes.map(
      (p) => p.permissao_codigo
    );

    // Extrair IDs das empresas vinculadas ao cargo
    const empresas = usuario.cargo.empresas?.map(
      (e) => e.empresa_id
    ) || [];

    const payload = {
      usuario_id: usuario.usuario_id,
      usuario_cargo_id: usuario.usuario_cargo_id,
      cargo_nome: usuario.cargo.cargo_usuario_nome,
      permissoes: permissoes,
      empresas: empresas,
    };

    const token = jwt.sign(payload, CHAVE, {
      expiresIn: "8h",
    });

    const pode_bater_ponto =
      !!usuario.usuario_funcionario_id &&
      permissoes.includes("ponto.registrar");

    const resposta = {
      usuario_id: usuario.usuario_id,
      usuario_nome: usuario.usuario_nome,
      usuario_troca_senha: usuario.usuario_troca_senha,
      usuario_cargo_id: usuario.usuario_cargo_id,
      cargo_nome: usuario.cargo.cargo_usuario_nome,
      permissoes: permissoes,
      empresas: empresas,
      token: token,
      pode_bater_ponto,
    };

    return res.status(200).json(resposta);
  } catch (err) {
    console.error("Erro na consulta:", err);
    if (err instanceof ApiError) throw err;
    throw ApiError.internal("Erro ao validar usuário");
  }
}
