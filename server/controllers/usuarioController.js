import { Usuario, CargoUsuario, Funcionario, Permissao, CargoPermissao, PerfilJornada, Empresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

function requireUser(req) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized(
      "Necessário estar logado para realizar operações."
    );
  }
  return usuario;
}

function requirePermissao(req, codigoPermissao) {
  const usuario = requireUser(req);
  const permissoes = usuario.permissoes || [];
  
  if (!permissoes.includes(codigoPermissao)) {
    throw ApiError.forbidden(
      `Você não tem permissão para realizar esta ação. Permissão necessária: ${codigoPermissao}`
    );
  }
  return usuario;
}

export async function registrarUsuario(req, res) {
  const { usuario_nome, usuario_login, usuario_cargo_id, perfil_jornada_id, empresa_id, tipo_usuario } = req.body;
  requirePermissao(req, "usuarios.gerenciar");

  if (!usuario_nome || !usuario_login) {
    throw ApiError.badRequest("Nome e login são obrigatórios.");
  }

  // Se for usuário do tipo funcionário, precisa de perfil de jornada e empresa
  if (tipo_usuario === "funcionario") {
    if (!perfil_jornada_id) {
      throw ApiError.badRequest("Perfil de carga horária é obrigatório para usuários funcionários.");
    }

    if (!empresa_id) {
      throw ApiError.badRequest("Empresa é obrigatória para usuários funcionários.");
    }

    // Verificar se o perfil de jornada existe
    const perfilJornada = await PerfilJornada.findByPk(perfil_jornada_id);
    if (!perfilJornada || perfilJornada.perfil_jornada_ativo === 0) {
      throw ApiError.badRequest("Perfil de carga horária inválido ou inativo.");
    }

    // Verificar se a empresa existe
    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      throw ApiError.badRequest("Empresa não encontrada.");
    }

    // Usar cargo padrão "Usuário Básico" para funcionários
    const cargoBasico = await CargoUsuario.findOne({
      where: { cargo_usuario_nome: "Usuário Básico" },
    });

    if (!cargoBasico) {
      throw ApiError.badRequest("Cargo padrão 'Usuário Básico' não encontrado.");
    }

    const senhaHash = bcrypt.hashSync("12345", 10);

    try {
      await Usuario.create({
        usuario_nome,
        usuario_login,
        usuario_senha: senhaHash,
        usuario_cargo_id: cargoBasico.cargo_usuario_id,
        usuario_perfil_jornada_id: perfil_jornada_id,
        usuario_empresa_id: empresa_id,
        usuario_funcionario_id: null,
      });

      // Garantir que o cargo tenha permissão de registrar ponto
      const permissaoRegistrarPonto = await Permissao.findOne({
        where: { permissao_codigo: "ponto.registrar" },
      });

      if (permissaoRegistrarPonto) {
        const temPermissao = await CargoPermissao.findOne({
          where: {
            cargo_usuario_id: cargoBasico.cargo_usuario_id,
            permissao_id: permissaoRegistrarPonto.permissao_id,
          },
        });

        if (!temPermissao) {
          await CargoPermissao.create({
            cargo_usuario_id: cargoBasico.cargo_usuario_id,
            permissao_id: permissaoRegistrarPonto.permissao_id,
          });
        }
      }

      return res.status(201).json({ message: "Usuário funcionário registrado com sucesso!" });
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        throw ApiError.badRequest("Já existe um usuário com este login.");
      }
      console.error("Erro ao registrar usuário:", err);
      throw ApiError.internal("Erro ao registrar usuário");
    }
  } else {
    // Usuário normal precisa de cargo
    if (!usuario_cargo_id) {
      throw ApiError.badRequest("Cargo é obrigatório para usuários do sistema.");
    }

    // Verificar se o cargo existe e está ativo
    const cargo = await CargoUsuario.findByPk(usuario_cargo_id);
    if (!cargo || cargo.cargo_usuario_ativo === 0) {
      throw ApiError.badRequest("Cargo inválido ou inativo.");
    }

    const senhaHash = bcrypt.hashSync("12345", 10);

    try {
      await Usuario.create({
        usuario_nome,
        usuario_login,
        usuario_senha: senhaHash,
        usuario_cargo_id,
        usuario_funcionario_id: null,
        usuario_perfil_jornada_id: null,
        usuario_empresa_id: null,
      });

      return res.status(201).json({ message: "Usuário registrado com sucesso!" });
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        throw ApiError.badRequest("Já existe um usuário com este login.");
      }
      console.error("Erro ao registrar usuário:", err);
      throw ApiError.internal("Erro ao registrar usuário");
    }
  }
}

export async function resetaSenhaUsuario(req, res) {
  const { id } = req.params;
  requirePermissao(req, "usuarios.gerenciar");

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
  requirePermissao(req, "usuarios.visualizar");

  try {
    // Buscar apenas usuários do sistema (sem perfil de jornada - não são funcionários)
    const usuarios = await Usuario.findAll({
      where: {
        usuario_perfil_jornada_id: null,
      },
      include: [
        {
          model: CargoUsuario,
          as: "cargo",
          attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
        },
      ],
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

// Buscar usuários do tipo funcionário
export async function getUsuariosFuncionarios(req, res) {
  requirePermissao(req, "usuarios.visualizar");

  try {
    const { empresa_id } = req.query;

    const whereClause = {
      usuario_perfil_jornada_id: { [Op.not]: null },
    };

    if (empresa_id) {
      whereClause.usuario_empresa_id = empresa_id;
    }

    const usuarios = await Usuario.findAll({
      where: whereClause,
      include: [
        {
          model: CargoUsuario,
          as: "cargo",
          attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
        },
        {
          model: PerfilJornada,
          as: "perfilJornada",
          attributes: ["perfil_jornada_id", "perfil_jornada_nome"],
        },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
      order: [["usuario_nome", "ASC"]],
    });

    return res.status(200).json(usuarios);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar funcionários:", err);
    throw ApiError.internal("Erro ao buscar funcionários");
  }
}

// Buscar funcionários sem usuário vinculado
export async function getFuncionariosSemUsuario(req, res) {
  requirePermissao(req, "usuarios.gerenciar_funcionarios");

  try {
    const { empresa_id } = req.query;
    
    if (!empresa_id) {
      throw ApiError.badRequest("ID da empresa é obrigatório.");
    }

    // Buscar todos os funcionários da empresa
    const todosFuncionarios = await Funcionario.findAll({
      where: {
        funcionario_empresa_id: empresa_id,
        funcionario_ativo: 1,
      },
      attributes: ["funcionario_id", "funcionario_nome"],
      order: [["funcionario_nome", "ASC"]],
    });

    // Buscar funcionários que já têm usuário vinculado
    const funcionariosComUsuario = await Usuario.findAll({
      where: {
        usuario_funcionario_id: { [Op.ne]: null },
      },
      attributes: ["usuario_funcionario_id"],
    });

    const idsComUsuario = funcionariosComUsuario
      .map((u) => u.usuario_funcionario_id)
      .filter((id) => id !== null);

    // Filtrar funcionários sem usuário
    const funcionariosSemUsuario = todosFuncionarios.filter(
      (f) => !idsComUsuario.includes(f.funcionario_id)
    );

    return res.status(200).json(funcionariosSemUsuario);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar funcionários sem usuário:", err);
    throw ApiError.internal("Erro ao buscar funcionários sem usuário");
  }
}

export async function inativaUsuario(req, res) {
  const { id } = req.params;
  requirePermissao(req, "usuarios.gerenciar");

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

// Atualizar cargo de um usuário
export async function atualizarCargoUsuario(req, res) {
  const { id } = req.params;
  const { usuario_cargo_id } = req.body;
  requirePermissao(req, "usuarios.gerenciar");

  if (!usuario_cargo_id) {
    throw ApiError.badRequest("Cargo é obrigatório.");
  }

  // Verificar se o cargo existe e está ativo
  const cargo = await CargoUsuario.findByPk(usuario_cargo_id);
  if (!cargo || cargo.cargo_usuario_ativo === 0) {
    throw ApiError.badRequest("Cargo inválido ou inativo.");
  }

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      throw ApiError.notFound("Usuário não encontrado");
    }

    usuario.usuario_cargo_id = usuario_cargo_id;
    await usuario.save();

    return res.status(200).json({ message: "Cargo do usuário atualizado com sucesso!" });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao atualizar cargo do usuário:", err);
    throw ApiError.internal("Erro ao atualizar cargo do usuário");
  }
}
