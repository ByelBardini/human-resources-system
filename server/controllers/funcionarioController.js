import { Funcionario, Setor, Cargo, Nivel } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import sequelize from "../config/database.js";
import fs from "fs/promises";
import path from "path";

function getUsuarioId(req) {
  return req?.user?.usuario_id ?? null;
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
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
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
    ],
  });

  return res.status(200).json(funcionarios);
}

export async function getFuncionariosInativos(req, res) {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
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
    ],
  });

  return res.status(200).json(funcionarios);
}

export async function getFuncionarioFull(req, res) {
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
