import { Funcionario, Setor, Cargo, Nivel, Usuario, CargoUsuario, CargoPermissao, CargoPermissaoEmpresa, Permissao } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import sequelize from "../config/database.js";
import fs from "fs/promises";
import path from "path";
import { Op } from "sequelize";

// Função para obter empresas permitidas para uma permissão específica
async function getEmpresasPermitidasParaPermissao(usuario, codigoPermissao) {
  // Buscar a permissão pelo código
  const permissao = await Permissao.findOne({
    where: { permissao_codigo: codigoPermissao },
  });

  if (!permissao) return null; // Permissão não existe

  // Buscar cargo_permissoes do cargo do usuário
  const cargoPermissao = await CargoPermissao.findOne({
    where: {
      cargo_usuario_id: usuario.usuario_cargo_id,
      permissao_id: permissao.permissao_id,
    },
    include: [
      {
        model: CargoPermissaoEmpresa,
        as: "empresasConfiguradas",
      },
    ],
  });

  if (!cargoPermissao) return null; // Usuário não tem essa permissão

  // Se não há empresas configuradas, retornar null (acesso a todas)
  if (!cargoPermissao.empresasConfiguradas || cargoPermissao.empresasConfiguradas.length === 0) {
    return null;
  }

  // Retornar lista de IDs de empresas permitidas
  return cargoPermissao.empresasConfiguradas.map((ec) => ec.empresa_id);
}

function getUsuarioId(req) {
  return req?.user?.usuario_id ?? null;
}

function requirePermissao(req, codigoPermissao) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized("Necessário estar logado para realizar operações.");
  }
  const permissoes = usuario.permissoes || [];
  if (!permissoes.includes(codigoPermissao)) {
    throw ApiError.forbidden(
      `Você não tem permissão para realizar esta ação. Permissão necessária: ${codigoPermissao}`
    );
  }
  return usuario;
}

export async function getCargoSetor(req, res) {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  const cargo = await Cargo.findAll({
    where: { cargo_empresa_id: id },
    attributes: ["cargo_id", "cargo_nome"],
    order: [["cargo_nome", "ASC"]],
  });
  const setor = await Setor.findAll({
    where: { setor_empresa_id: id },
    attributes: ["setor_id", "setor_nome"],
    order: [["setor_nome", "ASC"]],
  });
  return res.status(200).json({ cargo, setor });
}

export async function getFuncionarios(req, res) {
  const usuario = requirePermissao(req, "sistema.visualizar_funcionarios");
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  // Verificar se o usuário tem restrição de empresas para esta permissão
  const empresasPermitidas = await getEmpresasPermitidasParaPermissao(usuario, "sistema.visualizar_funcionarios");
  
  // Se há restrição e a empresa solicitada não está na lista, negar acesso
  if (empresasPermitidas !== null && !empresasPermitidas.includes(parseInt(id))) {
    throw ApiError.forbidden("Você não tem permissão para visualizar funcionários desta empresa.");
  }

  const funcionarios = await Funcionario.findAll({
    where: { funcionario_empresa_id: id, funcionario_ativo: 1 },
    attributes: [
      "funcionario_id",
      "funcionario_nome",
      "funcionario_sexo",
      "funcionario_data_nascimento",
      "funcionario_data_admissao",
    ],
    include: [
      { model: Setor, as: "setor", attributes: ["setor_nome"] },
      {
        model: Nivel,
        as: "nivel",
        attributes: ["nivel_nome", "nivel_salario"],
      },
      { model: Cargo, as: "cargo", attributes: ["cargo_nome"] },
      {
        model: Usuario,
        as: "usuario",
        required: false,
        attributes: ["usuario_id", "usuario_nome", "usuario_login", "usuario_ativo"],
        include: [
          {
            model: CargoUsuario,
            as: "cargo",
            attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
          },
        ],
      },
    ],
    order: [["funcionario_nome", "ASC"]],
  });

  return res.status(200).json(funcionarios);
}

export async function getFuncionariosInativos(req, res) {
  const usuario = requirePermissao(req, "sistema.visualizar_funcionarios");
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  // Verificar se o usuário tem restrição de empresas para esta permissão
  const empresasPermitidas = await getEmpresasPermitidasParaPermissao(usuario, "sistema.visualizar_funcionarios");
  
  // Se há restrição e a empresa solicitada não está na lista, negar acesso
  if (empresasPermitidas !== null && !empresasPermitidas.includes(parseInt(id))) {
    throw ApiError.forbidden("Você não tem permissão para visualizar funcionários desta empresa.");
  }

  const funcionarios = await Funcionario.findAll({
    where: { funcionario_empresa_id: id, funcionario_ativo: 0 },
    attributes: [
      "funcionario_id",
      "funcionario_nome",
      "funcionario_sexo",
      "funcionario_data_nascimento",
      "funcionario_data_admissao",
      "funcionario_data_desligamento",
      "funcionario_gasto_desligamento",
    ],
    include: [
      { model: Setor, as: "setor", attributes: ["setor_nome"] },
      {
        model: Nivel,
        as: "nivel",
        attributes: ["nivel_nome", "nivel_salario"],
      },
      { model: Cargo, as: "cargo", attributes: ["cargo_nome"] },
      {
        model: Usuario,
        as: "usuario",
        required: false,
        attributes: ["usuario_id", "usuario_nome", "usuario_login", "usuario_ativo"],
        include: [
          {
            model: CargoUsuario,
            as: "cargo",
            attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
          },
        ],
      },
    ],
    order: [["funcionario_nome", "ASC"]],
  });

  return res.status(200).json(funcionarios);
}

// Retorna funcionários que possuem usuário vinculado (para gerenciamento de usuários)
export async function getFuncionariosComUsuario(req, res) {
  requirePermissao(req, "usuarios.visualizar");
  const { empresa_id } = req.query;

  const whereClause = {};
  if (empresa_id) {
    whereClause.funcionario_empresa_id = empresa_id;
  }

  const funcionarios = await Funcionario.findAll({
    where: whereClause,
    attributes: [
      "funcionario_id",
      "funcionario_nome",
      "funcionario_ativo",
    ],
    include: [
      {
        model: Usuario,
        as: "usuario",
        required: true, // Só retorna funcionários que têm usuário
        attributes: ["usuario_id", "usuario_nome", "usuario_login", "usuario_ativo"],
        include: [
          {
            model: CargoUsuario,
            as: "cargo",
            attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
          },
        ],
      },
    ],
    order: [["funcionario_nome", "ASC"]],
  });

  return res.status(200).json(funcionarios);
}

export async function getFuncionarioFull(req, res) {
  requirePermissao(req, "sistema.visualizar_funcionarios");
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID do funcionário");
  }

  const funcionario = await Funcionario.findOne({
    where: { funcionario_id: id },
    include: [
      { model: Setor, as: "setor", attributes: ["setor_id", "setor_nome"] },
      {
        model: Nivel,
        as: "nivel",
        attributes: ["nivel_nome", "nivel_salario"],
      },
      { model: Cargo, as: "cargo", attributes: ["cargo_id", "cargo_nome"] },
    ],
  });

  return res.status(200).json(funcionario);
}

export async function putFuncionario(req, res) {
  requirePermissao(req, "sistema.gerenciar_funcionarios");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;
  const {
    funcionario_setor_id,
    funcionario_cargo_id,
    funcionario_nivel,
    funcionario_celular,
    funcionario_observacao,
  } = req.body;
  console.log(req.body);
  const fotoPath = req.file ? `/uploads/fotos/${req.file.filename}` : null;
  const caminhoNovaFoto = req.file ? path.resolve(req.file.path) : null;

  if (!id) {
    throw ApiError.badRequest("Necessário ID do funcionário");
  }

  if (
    !funcionario_setor_id ||
    !funcionario_cargo_id ||
    !funcionario_celular ||
    !funcionario_nivel
  ) {
    if (caminhoNovaFoto) await fs.unlink(caminhoNovaFoto).catch(() => {});
    throw ApiError.badRequest("Os dados são obrigatórios");
  }

  const funcionario = await Funcionario.findByPk(id);
  if (!funcionario) {
    if (caminhoNovaFoto) await fs.unlink(caminhoNovaFoto).catch(() => {});
    throw ApiError.badRequest("Funcionário não encontrado");
  }

  const nivel = await Nivel.findOne({
    where: {
      nivel_cargo_id: funcionario_cargo_id,
      nivel_nome: funcionario_nivel,
    },
  });

  if (!nivel) {
    if (caminhoNovaFoto) await fs.unlink(caminhoNovaFoto).catch(() => {});
    throw ApiError.badRequest("Nível inválido para o cargo informado");
  }
  const fotoAntiga = funcionario.funcionario_imagem_caminho || null;

  await funcionario.update(
    {
      funcionario_setor_id,
      funcionario_cargo_id,
      funcionario_nivel_id: nivel.nivel_id,
      funcionario_celular,
      funcionario_observacao,
      ...(fotoPath ? { funcionario_imagem_caminho: fotoPath } : {}),
    },
    {
      usuario_id: usuario_id,
    }
  );

  if (fotoPath && fotoAntiga && fotoAntiga !== fotoPath) {
    const oldAbs = path.join(process.cwd(), fotoAntiga.replace(/^\//, ""));
    await fs.unlink(oldAbs).catch(() => {});
  }

  return res.status(201).json({ message: "Funcionário alterado com sucesso!" });
}

export async function postFuncionario(req, res) {
  requirePermissao(req, "sistema.gerenciar_funcionarios");
  const usuario_id = getUsuarioId(req);

  const {
    funcionario_empresa_id,
    funcionario_setor_id,
    funcionario_cargo_id,
    funcionario_nivel,
    funcionario_nome,
    funcionario_cpf,
    funcionario_celular,
    funcionario_sexo,
    funcionario_data_nascimento,
    funcionario_data_admissao,
  } = req.body;
  const fotoPath = req.file ? `/uploads/fotos/${req.file.filename}` : null;

  if (
    !funcionario_empresa_id ||
    !funcionario_setor_id ||
    !funcionario_cargo_id ||
    !funcionario_nivel ||
    !funcionario_nome ||
    !funcionario_cpf ||
    !funcionario_sexo ||
    !funcionario_data_nascimento ||
    !funcionario_data_admissao
  ) {
    throw ApiError.badRequest("Todos os dados são obrigatórios");
  }
  console.log(req.body);

  const nivel = await Nivel.findOne({
    where: {
      nivel_cargo_id: funcionario_cargo_id,
      nivel_nome: funcionario_nivel,
    },
  });

  const novoFuncionario = await Funcionario.create(
    {
      funcionario_empresa_id,
      funcionario_setor_id,
      funcionario_cargo_id,
      funcionario_nivel_id: nivel.nivel_id,
      funcionario_nome,
      funcionario_cpf,
      funcionario_celular,
      funcionario_sexo,
      funcionario_data_nascimento,
      funcionario_data_admissao,
      funcionario_imagem_caminho: fotoPath,
    },
    {
      usuario_id: usuario_id,
    }
  );

  return res.status(201).json(novoFuncionario);
}

export async function inativaFuncionario(req, res) {
  requirePermissao(req, "sistema.gerenciar_funcionarios");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;
  const { data_inativa, comentario, gasto_desligamento } = req.body;

  if (!data_inativa || !gasto_desligamento) {
    throw ApiError.badRequest(
      "Necessário informar a data e o custo do desligamento"
    );
  }

  const funcionario = await Funcionario.findByPk(id);

  if (!funcionario) {
    throw ApiError.badRequest("Funcionário não encontrado");
  }

  await sequelize.transaction(async (t) => {
    funcionario.funcionario_ativo = 0;
    funcionario.funcionario_data_desligamento = data_inativa;
    funcionario.funcionario_motivo_inativa = comentario;
    funcionario.funcionario_gasto_desligamento = gasto_desligamento;

    await funcionario.save({
      transaction: t,
      usuario_id: usuario_id,
    });
  });

  return res
    .status(200)
    .json({ message: "Funcionário inativado com sucesso." });
}
