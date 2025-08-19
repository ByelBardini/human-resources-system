import { Cargo, Nivel, Descricao } from "../models/index.js";
import { UniqueConstraintError } from "sequelize";
import sequelize from "../config/database.js";

export async function postCargo(req, res) {
  const { cargo_empresa_id, cargo_nome, salario_inicial } = req.body;

  if (!cargo_empresa_id || !cargo_nome || !salario_inicial) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
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

  try {
    await sequelize.transaction(async (t) => {
      const cargo = await Cargo.create(
        {
          cargo_empresa_id,
          cargo_nome,
          cargo_descricao: null,
          cargo_ativo: 1,
        },

        { transaction: t }
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
  } catch (err) {
    console.error("Erro ao criar cargo:", err);
    if (
      err instanceof UniqueConstraintError ||
      err?.parent?.code === "ER_DUP_ENTRY"
    ) {
      return res
        .status(409)
        .json({ error: "Já existe um cargo com o mesmo nome" });
    }
    return res.status(500).json({
      error: "Erro ao criar cargo, fale com um administrador do sistema",
    });
  }
}

export async function aumentoGeral(req, res) {
  const { cargo_empresa_id, porcentagem } = req.body;
  if (!porcentagem || !cargo_empresa_id) {
    return res.status(400).json({ error: "Todos os dados são necessários" });
  }

  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  console.log("body: ", cargo_empresa_id, porcentagem);

  try {
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
    });
    return res.status(200).json({ message: "Aumento aplicado com sucesso." });
  } catch (err) {
    console.error("Erro ao aplicar aumento:", err);
    return res.status(500).json({
      error: "Erro ao aplicar aumento, fale com um administrador do sistema",
    });
  }
}

export async function getCargos(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  const id = req.params.id;
  if (!id) {
    return res
      .status(400)
      .json({ error: "Necessário informar o ID da empresa." });
  }

  try {
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
  } catch (err) {
    console.error("Erro ao buscar cargos:", err);
    return res.status(500).json({
      error: "Erro ao buscar cargos, fale com um administrador do sistema",
    });
  }
}

export async function getCargosDescricao(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const cargos = await Cargo.findAll({
      attributes: ["cargo_id", "cargo_nome", "cargo_descricao"],
      where: { cargo_ativo: 1 },
      order: [["cargo_nome", "ASC"]],
    });

    return res.status(200).json(cargos);
  } catch (err) {
    console.error("Erro ao buscar cargos:", err);
    return res.status(500).json({
      error: "Erro ao buscar cargos, fale com um administrador do sistema",
    });
  }
}

export async function putCargo(req, res) {
  const { cargo_id, cargo_nome, cargo_descricao } = req.body;

  if (!cargo_id || !cargo_nome) {
    return res.status(400).json({ error: "Cargo ID e nome são obrigatórios." });
  }

  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const cargo = await Cargo.findByPk(cargo_id);
    if (!cargo) {
      return res.status(404).json({ error: "Cargo não encontrado." });
    }

    cargo.cargo_nome = cargo_nome;
    cargo.cargo_descricao = cargo_descricao || null;

    await cargo.save();

    return res.status(200).json({ message: "Cargo atualizado com sucesso." });
  } catch (err) {
    console.error("Erro ao atualizar cargo:", err);
    return res.status(500).json({
      error: "Erro ao atualizar cargo, fale com um administrador do sistema",
    });
  }
}

export async function deleteCargo(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Necessário ID para deletar cargo" });
  }

  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const cargo = await Cargo.findByPk(id);

    cargo.destroy();

    return res.status(200).json({ message: "Cargo excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao deletar cargo:", err);
    return res.status(500).json({
      error: "Erro ao excluir cargo, fale com um administrador do sistema",
    });
  }
}
