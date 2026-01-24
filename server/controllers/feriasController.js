import { Ferias, Usuario, Funcionario, Empresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op } from "sequelize";

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

function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str = typeof dateStr === "string" ? dateStr : dateStr.toISOString().split("T")[0];
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatarDataStr(data) {
  if (!data) return null;
  if (typeof data === "string") return data.split("T")[0];
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

function validarPeriodo(inicioStr, fimStr) {
  const inicio = parseDateOnly(inicioStr);
  const fim = parseDateOnly(fimStr);
  if (!inicio || !fim) {
    throw ApiError.badRequest("Data de início e fim são obrigatórias");
  }
  if (inicio > fim) {
    throw ApiError.badRequest("Data de início não pode ser maior que a data fim");
  }
  return { inicio, fim };
}

async function verificarConflito(usuario_id, inicioStr, fimStr, excluirId = null) {
  const where = {
    ferias_usuario_id: usuario_id,
    ferias_ativo: 1,
    ferias_status: "aprovada",
    [Op.and]: [
      { ferias_data_inicio: { [Op.lte]: fimStr } },
      { ferias_data_fim: { [Op.gte]: inicioStr } },
    ],
  };
  if (excluirId) {
    where.ferias_id = { [Op.ne]: excluirId };
  }
  const conflito = await Ferias.findOne({ where });
  if (conflito) {
    throw ApiError.badRequest("Já existe um período de férias nesse intervalo");
  }
}

export async function getUsuariosFerias(req, res) {
  requirePermissao(req, "sistema.gerenciar_ferias");

  const { empresa_id } = req.query;
  const whereClause = {
    usuario_perfil_jornada_id: { [Op.not]: null },
    usuario_ativo: 1,
  };
  if (empresa_id) {
    whereClause.usuario_empresa_id = empresa_id;
  }

  const usuarios = await Usuario.findAll({
    where: whereClause,
    attributes: ["usuario_id", "usuario_nome", "usuario_empresa_id", "usuario_funcionario_id"],
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_id", "funcionario_nome"],
      },
    ],
    order: [["usuario_nome", "ASC"]],
  });

  return res.status(200).json({ usuarios });
}

export async function getFerias(req, res) {
  requirePermissao(req, "sistema.gerenciar_ferias");

  const { usuario_id, empresa_id, data_inicio, data_fim, incluir_inativos } = req.query;

  const where = {};
  if (!incluir_inativos) {
    where.ferias_ativo = 1;
  }
  if (usuario_id) {
    where.ferias_usuario_id = usuario_id;
  }
  if (data_inicio && data_fim) {
    where[Op.and] = [
      { ferias_data_inicio: { [Op.lte]: data_fim } },
      { ferias_data_fim: { [Op.gte]: data_inicio } },
    ];
  }

  const include = [
    {
      model: Usuario,
      as: "usuario",
      attributes: ["usuario_id", "usuario_nome", "usuario_empresa_id", "usuario_funcionario_id"],
      include: [
        {
          model: Empresa,
          as: "empresa",
          attributes: ["empresa_id", "empresa_nome"],
        },
      ],
    },
    {
      model: Funcionario,
      as: "funcionario",
      attributes: ["funcionario_id", "funcionario_nome"],
    },
  ];

  if (empresa_id) {
    include[0].where = { usuario_empresa_id: empresa_id };
  }

  const ferias = await Ferias.findAll({
    where,
    include,
    order: [["ferias_data_inicio", "ASC"]],
  });

  return res.status(200).json({ ferias });
}

export async function criarFerias(req, res) {
  requirePermissao(req, "sistema.gerenciar_ferias");

  const { usuario_id, data_inicio, data_fim } = req.body;

  if (!usuario_id) {
    throw ApiError.badRequest("Usuário é obrigatório");
  }

  validarPeriodo(data_inicio, data_fim);

  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_id", "usuario_nome", "usuario_funcionario_id", "usuario_ativo"],
  });
  if (!usuario || usuario.usuario_ativo !== 1) {
    throw ApiError.badRequest("Usuário inválido ou inativo");
  }

  await verificarConflito(usuario_id, data_inicio, data_fim);

  const novaFerias = await Ferias.create({
    ferias_usuario_id: usuario_id,
    ferias_funcionario_id: usuario.usuario_funcionario_id || null,
    ferias_data_inicio: formatarDataStr(data_inicio),
    ferias_data_fim: formatarDataStr(data_fim),
    ferias_status: "aprovada",
    ferias_ativo: 1,
  });

  const feriasCompleta = await Ferias.findByPk(novaFerias.ferias_id, {
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: ["usuario_id", "usuario_nome", "usuario_empresa_id", "usuario_funcionario_id"],
        include: [
          {
            model: Empresa,
            as: "empresa",
            attributes: ["empresa_id", "empresa_nome"],
          },
        ],
      },
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_id", "funcionario_nome"],
      },
    ],
  });

  return res.status(201).json({
    ferias: feriasCompleta,
    mensagem: "Férias cadastradas com sucesso",
  });
}

export async function atualizarFerias(req, res) {
  requirePermissao(req, "sistema.gerenciar_ferias");

  const { id } = req.params;
  const { data_inicio, data_fim } = req.body;

  if (!id) {
    throw ApiError.badRequest("ID das férias é obrigatório");
  }

  const ferias = await Ferias.findByPk(id);
  if (!ferias) {
    throw ApiError.notFound("Período de férias não encontrado");
  }

  const inicioAtual = formatarDataStr(ferias.ferias_data_inicio);
  const fimAtual = formatarDataStr(ferias.ferias_data_fim);
  const inicioNovo = data_inicio || inicioAtual;
  const fimNovo = data_fim || fimAtual;

  validarPeriodo(inicioNovo, fimNovo);
  await verificarConflito(ferias.ferias_usuario_id, inicioNovo, fimNovo, ferias.ferias_id);

  await ferias.update({
    ferias_data_inicio: inicioNovo,
    ferias_data_fim: fimNovo,
  });

  const feriasCompleta = await Ferias.findByPk(ferias.ferias_id, {
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: ["usuario_id", "usuario_nome", "usuario_empresa_id", "usuario_funcionario_id"],
        include: [
          {
            model: Empresa,
            as: "empresa",
            attributes: ["empresa_id", "empresa_nome"],
          },
        ],
      },
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_id", "funcionario_nome"],
      },
    ],
  });

  return res.status(200).json({
    ferias: feriasCompleta,
    mensagem: "Férias atualizadas com sucesso",
  });
}

export async function cancelarFerias(req, res) {
  requirePermissao(req, "sistema.gerenciar_ferias");

  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("ID das férias é obrigatório");
  }

  const ferias = await Ferias.findByPk(id);
  if (!ferias) {
    throw ApiError.notFound("Período de férias não encontrado");
  }

  if (ferias.ferias_ativo === 0) {
    return res.status(200).json({
      ferias,
      mensagem: "Período de férias já está cancelado",
    });
  }

  await ferias.update({
    ferias_ativo: 0,
    ferias_status: "cancelada",
  });

  return res.status(200).json({
    ferias,
    mensagem: "Férias canceladas com sucesso",
  });
}
