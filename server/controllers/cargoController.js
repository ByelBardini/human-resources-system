import { Cargo, Nivel, Descricao, Log, Funcionario } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import sequelize from "../config/database.js";

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

const transformaEmNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "bigint") return Number(valor);
  const s = String(valor)
    .replace(/\s/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error("Valor numérico inválido");
  return n;
};

const duasCasas = (x) =>
  Math.round((transformaEmNumero(x) + Number.EPSILON) * 100) / 100;

export async function postCargo(req, res) {
  requirePermissao(req, "gerenciar_cargos");
  const usuario_id = getUsuarioId(req);

  const { cargo_empresa_id, cargo_nome, salario_inicial } = req.body;

  if (!cargo_empresa_id || !cargo_nome || salario_inicial == null) {
    throw ApiError.badRequest("Todos os campos são obrigatórios.");
  }

  await sequelize.transaction(async (t) => {
    const cargo = await Cargo.create(
      {
        cargo_empresa_id,
        cargo_nome,
        cargo_descricao: null,
        cargo_ativo: 1,
      },
      {
        transaction: t,
        salario_inicial: salario_inicial,
        usuario_id: usuario_id,
      }
    );
    const salInicial = duasCasas(salario_inicial);
    const salJuniorI = duasCasas(salInicial * 1.05);
    const salJuniorII = duasCasas(salJuniorI * 1.05);
    const salJuniorIII = duasCasas(salJuniorII * 1.05);

    const salPlenoI = duasCasas(salJuniorIII * 1.065);
    const salPlenoII = duasCasas(salPlenoI * 1.065);
    const salPlenoIII = duasCasas(salPlenoII * 1.065);

    const salSeniorI = duasCasas(salPlenoIII * 1.07);
    const salSeniorII = duasCasas(salSeniorI * 1.07);
    const salSeniorIII = duasCasas(salSeniorII * 1.07);

    await Nivel.bulkCreate(
      [
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Inicial",
          nivel_salario: salInicial,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Júnior I",
          nivel_salario: salJuniorI,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Júnior II",
          nivel_salario: salJuniorII,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Júnior III",
          nivel_salario: salJuniorIII,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Pleno I",
          nivel_salario: salPlenoI,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Pleno II",
          nivel_salario: salPlenoII,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Pleno III",
          nivel_salario: salPlenoIII,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Sênior I",
          nivel_salario: salSeniorI,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Sênior II",
          nivel_salario: salSeniorII,
        },
        {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Sênior III",
          nivel_salario: salSeniorIII,
        },
      ],
      { transaction: t }
    );

    await Descricao.create(
      {
        descricao_cargo_id: cargo.cargo_id,
        descricao_empresa_id: cargo_empresa_id,
      },
      { transaction: t }
    );

    return res
      .status(201)
      .json({ message: "Cargo e níveis criados com sucesso." });
  });
}

export async function aumentoGeral(req, res) {
  requirePermissao(req, "gerenciar_cargos");
  const usuario_id = getUsuarioId(req);

  const { cargo_empresa_id, porcentagem } = req.body;
  if (!cargo_empresa_id || porcentagem == null) {
    throw ApiError.badRequest("Todos os dados são necessários.");
  }

  await sequelize.transaction(async (t) => {
    const cargos = await Cargo.findAll({
      where: { cargo_empresa_id },
      transaction: t,
    });

    const transformaEmNumero = (valor) => {
      if (valor === null || valor === undefined) return NaN;
      if (typeof valor === "number") return valor;
      if (typeof valor === "bigint") return Number(valor);
      const s = String(valor)
        .replace(/\s/g, "")
        .replace(/%/g, "")
        .replace(/[R$\u00A0]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    };

    const duasCasas = (x) =>
      Math.round((transformaEmNumero(x) + Number.EPSILON) * 100) / 100;

    for (const cargo of cargos) {
      const nivelInicial = await Nivel.findOne({
        where: {
          nivel_cargo_id: cargo.cargo_id,
          nivel_nome: "Inicial",
        },
        transaction: t,
      });

      const salarioBase =
        (1 + transformaEmNumero(porcentagem) / 100) *
        nivelInicial.nivel_salario;

      console.log(salarioBase);

      console.log("salario base: ", salarioBase);
      const salInicial = duasCasas(salarioBase);
      const salJuniorI = duasCasas(salInicial * 1.05);
      const salJuniorII = duasCasas(salJuniorI * 1.05);
      const salJuniorIII = duasCasas(salJuniorII * 1.05);

      const salPlenoI = duasCasas(salJuniorIII * 1.065);
      const salPlenoII = duasCasas(salPlenoI * 1.065);
      const salPlenoIII = duasCasas(salPlenoII * 1.065);

      const salSeniorI = duasCasas(salPlenoIII * 1.07);
      const salSeniorII = duasCasas(salSeniorI * 1.07);
      const salSeniorIII = duasCasas(salSeniorII * 1.07);

      const updates = [
        ["Inicial", salInicial],
        ["Júnior I", salJuniorI],
        ["Júnior II", salJuniorII],
        ["Júnior III", salJuniorIII],
        ["Pleno I", salPlenoI],
        ["Pleno II", salPlenoII],
        ["Pleno III", salPlenoIII],
        ["Sênior I", salSeniorI],
        ["Sênior II", salSeniorII],
        ["Sênior III", salSeniorIII],
      ];

      for (const [nome, salario] of updates) {
        await Nivel.update(
          { nivel_salario: salario },
          {
            where: { nivel_cargo_id: cargo.cargo_id, nivel_nome: nome },
            transaction: t,
          }
        );
      }
    }
    await Log.create(
      {
        log_usuario_id: usuario_id,
        log_operacao_realizada: "Aumento Geral Aplicado",
        log_valor_antigo: "-",
        log_valor_novo: `${porcentagem} %`,
        log_data_alteracao: new Date(),
      },
      {
        transaction: t,
      }
    );
  });
  return res.status(200).json({ message: "Aumento aplicado com sucesso." });
}

export async function getCargos(req, res) {
  requirePermissao(req, "gerenciar_cargos");
  const id = req.params.id;
  if (!id) throw ApiError.badRequest("Necessário informar o ID da empresa.");

  const cargos = await Cargo.findAll({
    attributes: ["cargo_id", "cargo_nome"],
    where: { cargo_ativo: 1, cargo_empresa_id: id },
    order: [["cargo_nome", "ASC"]],
    include: [
      {
        model: Nivel,
        as: "niveis",
        attributes: ["nivel_id", "nivel_nome", "nivel_salario"],
        separate: true,
        order: [["nivel_id", "ASC"]],
      },
    ],
  });

  return res.status(200).json(cargos);
}

export async function deleteCargo(req, res) {
  requirePermissao(req, "gerenciar_cargos");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID do cargo a ser deletado.");
  }
  const cargo = await Cargo.findByPk(id);

  if (!cargo) throw ApiError.notFound("Cargo não encontrado.");

  try {
    await sequelize.transaction(async (t) => {
      const [qtdFuncs] = await Promise.all([
        Funcionario.count({
          where: { funcionario_cargo_id: id },
          transaction: t,
        }),
      ]);

      if (qtdFuncs) {
        throw ApiError.conflict(
          `Não é possível excluir: existem ${qtdFuncs} funcionário(s) vinculados a este cargo. `
        );
      }

      await cargo.destroy({ transaction: t, usuario_id });
    });

    return res.status(200).json({ message: "Cargo excluído com sucesso!" });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (
      err?.name === "SequelizeForeignKeyConstraintError" ||
      err?.original?.code === "ER_ROW_IS_REFERENCED"
    ) {
      throw ApiError.conflict(
        "Não é possível excluir: o cargo está em uso por outras tabelas."
      );
    }

    console.error("Erro ao excluir cargo:", err);
    throw ApiError.internal("Erro ao excluir cargo.");
  }
}
