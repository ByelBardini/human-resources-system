import { CargoUsuario, Permissao, Usuario, Empresa, CategoriaPermissao, CargoPermissao, CargoPermissaoEmpresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import sequelize from "../config/database.js";

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

// Listar todos os cargos de usuários
export async function getCargosUsuarios(req, res) {
  requirePermissao(req, "cargos.gerenciar");

  try {
    const cargos = await CargoUsuario.findAll({
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["permissao_id", "permissao_codigo", "permissao_nome"],
          include: [
            {
              model: CategoriaPermissao,
              as: "categoria",
              attributes: ["categoria_id", "categoria_codigo", "categoria_nome", "categoria_ordem"],
            },
          ],
        },
        {
          model: Empresa,
          as: "empresas",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
      order: [["cargo_usuario_nome", "ASC"]],
    });

    return res.status(200).json(cargos);
  } catch (err) {
    console.error("Erro ao buscar cargos de usuários:", err);
    throw ApiError.internal("Erro ao buscar cargos de usuários");
  }
}

// Obter um cargo específico
export async function getCargoUsuario(req, res) {
  requirePermissao(req, "cargos.gerenciar");
  const { id } = req.params;

  try {
    const cargo = await CargoUsuario.findByPk(id, {
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["permissao_id", "permissao_codigo", "permissao_nome"],
          include: [
            {
              model: CategoriaPermissao,
              as: "categoria",
              attributes: ["categoria_id", "categoria_codigo", "categoria_nome", "categoria_ordem"],
            },
          ],
        },
        {
          model: Empresa,
          as: "empresas",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
    });

    if (!cargo) {
      throw ApiError.notFound("Cargo não encontrado");
    }

    // Buscar empresas por permissão
    const cargoPermissoes = await CargoPermissao.findAll({
      where: { cargo_usuario_id: id },
      include: [
        {
          model: CargoPermissaoEmpresa,
          as: "empresasConfiguradas",
          include: [
            {
              model: Empresa,
              as: "empresa",
              attributes: ["empresa_id", "empresa_nome"],
            },
          ],
        },
        {
          model: Permissao,
          as: "permissao",
          attributes: ["permissao_id", "permissao_codigo"],
        },
      ],
    });

    // Montar objeto de empresas por permissão
    const permissoesEmpresas = {};
    for (const cp of cargoPermissoes) {
      if (cp.empresasConfiguradas && cp.empresasConfiguradas.length > 0) {
        permissoesEmpresas[cp.permissao_id] = cp.empresasConfiguradas.map(
          (ec) => ({
            empresa_id: ec.empresa.empresa_id,
            empresa_nome: ec.empresa.empresa_nome,
          })
        );
      }
    }

    return res.status(200).json({
      ...cargo.toJSON(),
      permissoesEmpresas,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar cargo:", err);
    throw ApiError.internal("Erro ao buscar cargo");
  }
}

// Criar novo cargo
export async function postCargoUsuario(req, res) {
  requirePermissao(req, "cargos.gerenciar");
  const { cargo_usuario_nome, cargo_usuario_descricao, permissoes, empresas } = req.body;

  if (!cargo_usuario_nome) {
    throw ApiError.badRequest("Nome do cargo é obrigatório.");
  }

  try {
    const cargo = await CargoUsuario.create({
      cargo_usuario_nome,
      cargo_usuario_descricao: cargo_usuario_descricao || null,
      cargo_usuario_ativo: 1,
    });

    // Atribuir permissões se fornecidas
    if (permissoes && Array.isArray(permissoes) && permissoes.length > 0) {
      await cargo.setPermissoes(permissoes);
    }

    // Atribuir empresas se fornecidas
    if (empresas && Array.isArray(empresas) && empresas.length > 0) {
      await cargo.setEmpresas(empresas);
    }

    // Buscar cargo com permissões e empresas para retornar
    const cargoCompleto = await CargoUsuario.findByPk(cargo.cargo_usuario_id, {
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["permissao_id", "permissao_codigo", "permissao_nome"],
        },
        {
          model: Empresa,
          as: "empresas",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
    });

    return res.status(201).json(cargoCompleto);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw ApiError.badRequest("Já existe um cargo com este nome.");
    }
    console.error("Erro ao criar cargo:", err);
    throw ApiError.internal("Erro ao criar cargo");
  }
}

// Atualizar cargo
export async function putCargoUsuario(req, res) {
  requirePermissao(req, "cargos.gerenciar");
  const { id } = req.params;
  const { cargo_usuario_nome, cargo_usuario_descricao, cargo_usuario_ativo, permissoes, empresas, permissoesEmpresas } = req.body;

  try {
    const cargo = await CargoUsuario.findByPk(id);

    if (!cargo) {
      throw ApiError.notFound("Cargo não encontrado");
    }

    await sequelize.transaction(async (t) => {
      // Atualizar campos
      if (cargo_usuario_nome !== undefined) cargo.cargo_usuario_nome = cargo_usuario_nome;
      if (cargo_usuario_descricao !== undefined) cargo.cargo_usuario_descricao = cargo_usuario_descricao;
      if (cargo_usuario_ativo !== undefined) cargo.cargo_usuario_ativo = cargo_usuario_ativo;

      await cargo.save({ transaction: t });

      // Atualizar permissões se fornecidas
      if (permissoes !== undefined && Array.isArray(permissoes)) {
        await cargo.setPermissoes(permissoes, { transaction: t });
      }

      // Atualizar empresas se fornecidas
      if (empresas !== undefined && Array.isArray(empresas)) {
        await cargo.setEmpresas(empresas, { transaction: t });
      }

      // Atualizar empresas específicas por permissão se fornecidas
      // formato: { permissao_id: [empresa_id1, empresa_id2, ...], ... }
      if (permissoesEmpresas !== undefined && typeof permissoesEmpresas === "object") {
        // Buscar cargo_permissoes do cargo atual
        const cargoPermissoes = await CargoPermissao.findAll({
          where: { cargo_usuario_id: id },
          transaction: t,
        });

        for (const cp of cargoPermissoes) {
          const permissaoId = cp.permissao_id.toString();
          
          // Deletar configurações anteriores desta permissão
          await CargoPermissaoEmpresa.destroy({
            where: { cargo_permissoes_id: cp.cargo_permissoes_id },
            transaction: t,
          });

          // Se há empresas configuradas para esta permissão, criar novas
          if (permissoesEmpresas[permissaoId] && Array.isArray(permissoesEmpresas[permissaoId])) {
            const empresasParaPermissao = permissoesEmpresas[permissaoId];
            for (const empresaId of empresasParaPermissao) {
              await CargoPermissaoEmpresa.create({
                cargo_permissoes_id: cp.cargo_permissoes_id,
                empresa_id: empresaId,
              }, { transaction: t });
            }
          }
        }
      }
    });

    // Buscar cargo atualizado com permissões e empresas
    const cargoAtualizado = await CargoUsuario.findByPk(id, {
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["permissao_id", "permissao_codigo", "permissao_nome"],
          through: {
            attributes: ["cargo_permissoes_id"],
          },
        },
        {
          model: Empresa,
          as: "empresas",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
    });

    // Buscar empresas por permissão
    const cargoPermissoes = await CargoPermissao.findAll({
      where: { cargo_usuario_id: id },
      include: [
        {
          model: CargoPermissaoEmpresa,
          as: "empresasConfiguradas",
          include: [
            {
              model: Empresa,
              as: "empresa",
              attributes: ["empresa_id", "empresa_nome"],
            },
          ],
        },
        {
          model: Permissao,
          as: "permissao",
          attributes: ["permissao_id", "permissao_codigo"],
        },
      ],
    });

    // Montar objeto de empresas por permissão
    const permissoesEmpresasResponse = {};
    for (const cp of cargoPermissoes) {
      if (cp.empresasConfiguradas && cp.empresasConfiguradas.length > 0) {
        permissoesEmpresasResponse[cp.permissao_id] = cp.empresasConfiguradas.map(
          (ec) => ({
            empresa_id: ec.empresa.empresa_id,
            empresa_nome: ec.empresa.empresa_nome,
          })
        );
      }
    }

    return res.status(200).json({
      ...cargoAtualizado.toJSON(),
      permissoesEmpresas: permissoesEmpresasResponse,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === "SequelizeUniqueConstraintError") {
      throw ApiError.badRequest("Já existe um cargo com este nome.");
    }
    console.error("Erro ao atualizar cargo:", err);
    throw ApiError.internal("Erro ao atualizar cargo");
  }
}

// Deletar cargo (soft delete - inativar)
export async function deleteCargoUsuario(req, res) {
  requirePermissao(req, "cargos.gerenciar");
  const { id } = req.params;

  try {
    const cargo = await CargoUsuario.findByPk(id);

    if (!cargo) {
      throw ApiError.notFound("Cargo não encontrado");
    }

    // Verificar se há usuários usando este cargo
    const usuariosComCargo = await Usuario.count({
      where: { usuario_cargo_id: id },
    });

    if (usuariosComCargo > 0) {
      throw ApiError.badRequest(
        `Não é possível excluir este cargo pois existem ${usuariosComCargo} usuário(s) atribuído(s) a ele.`
      );
    }

    // Inativar cargo ao invés de deletar
    cargo.cargo_usuario_ativo = 0;
    await cargo.save();

    return res.status(200).json({ message: "Cargo inativado com sucesso!" });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao deletar cargo:", err);
    throw ApiError.internal("Erro ao deletar cargo");
  }
}

