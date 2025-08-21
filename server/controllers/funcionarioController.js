import { Funcionario, Setor, Cargo, Nivel } from "../models/index.js";
import { UniqueConstraintError } from "sequelize";

export async function getCargoSetor(req, res) {
  const { id } = req.params;
  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
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
  } catch (err) {
    console.error("Erro ao buscar cargos e setores:", err);
    return res.status(500).json({ error: "Erro ao buscar cargos e setores" });
  }
}

export async function getFuncionarios(req, res) {
  const { id } = req.params;

  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const funcionarios = await Funcionario.findAll({
      where: { funcionario_empresa_id: id },
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
      ],
    });

    return res.status(200).json(funcionarios);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    return res.status(500).json({ error: "Erro ao buscar funcionários" });
  }
}

export async function getFuncionarioFull(req, res) {
  const { id } = req.params;

  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const funcionario = await Funcionario.findOne({
      where: { funcionario_id: id },
      attributes: [
        "funcionario_id",
        "funcionario_nome",
        "funcionario_cpf",
        "funcionario_celular",
        "funcionario_sexo",
        "funcionario_imagem_caminho",
        "funcionario_data_nascimento",
        "funcionario_data_admissao",
        "funcionario_observacao",
      ],
      include: [
        { model: Setor, as: "setor", attributes: ["setor_nome"] },
        {
          model: Nivel,
          as: "nivel",
          attributes: ["nivel_nome", "nivel_salario"],
        },
        { model: Cargo, as: "cargo", attributes: ["cargo_nome"] },
      ],
    });

    return res.status(200).json(funcionario);
  } catch (err) {
    console.error("Erro ao buscar funcionário:", err);
    return res.status(500).json({ error: "Erro ao buscar funcionário" });
  }
}

export async function putFuncionario(req, res) {
  const { id } = req.params;
  const {
    funcionario_setor_id,
    funcionario_nome,
    funcionario_cargo,
    funcionario_nivel,
    funcionario_cpf,
    funcionario_sexo,
    funcionario_salario,
  } = req.body;
  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (
    !funcionario_nome ||
    !funcionario_cargo ||
    !funcionario_setor_id ||
    !funcionario_nivel ||
    !funcionario_cpf ||
    !funcionario_sexo ||
    !funcionario_salario
  ) {
    return res.status(400).json({ error: "Os dados são obrigatórios" });
  }

  try {
    const funcionario = await Funcionario.findByPk(id);

    if (!funcionario) {
      return res.status(404).json({ error: "Funcionário não encontrado." });
    }

    funcionario.funcionario_nome = funcionario_nome;
    funcionario.funcionario_cargo = funcionario_cargo;
    funcionario.funcionario_setor_id = funcionario_setor_id;
    funcionario.funcionario_nivel = funcionario_nivel;
    funcionario.funcionario_cpf = funcionario_cpf;
    funcionario.funcionario_sexo = funcionario_sexo;
    funcionario.funcionario_salario = funcionario_salario;

    await funcionario.save();

    return res.status(200).json(funcionario);
  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    return res.status(500).json({ error: "Erro ao atualizar funcionário" });
  }
}

export async function postFuncionario(req, res) {
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
  const { usuario_id } = req.session.user;
  const fotoPath = req.file ? `/uploads/fotos/${req.file.filename}` : null;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

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
    return res.status(400).json({ error: "Todos os dados são obrigatórios." });
  }
  console.log(req.body);

  try {
    const nivel = await Nivel.findOne({
      where: {
        nivel_cargo_id: funcionario_cargo_id,
        nivel_nome: funcionario_nivel,
      },
    });

    const novoFuncionario = await Funcionario.create({
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
    });

    return res.status(201).json(novoFuncionario);
  } catch (err) {
    if (
      err instanceof UniqueConstraintError ||
      err?.parent?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({ error: "Nome e/ou CPF já cadastrados" });
    }
    console.error("Erro ao criar funcionário:", err);
    return res.status(500).json({ error: "Erro ao criar funcionário" });
  }
}

export async function inativaFuncionario(req, res) {
  const { id } = req.params;
  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const funcionario = await Funcionario.findByPk(id);

    if (!funcionario) {
      return res.status(404).json({ error: "Funcionário não encontrado." });
    }

    funcionario.funcionario_ativo = 0;
    await funcionario.save();

    return res
      .status(200)
      .json({ message: "Funcionário inativado com sucesso." });
  } catch (err) {
    console.error("Erro ao inativar funcionário:", err);
    return res.status(500).json({ error: "Erro ao inativar funcionário" });
  }
}
