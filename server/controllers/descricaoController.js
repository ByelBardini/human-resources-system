import { Descricao, Setor, Cargo } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";

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

export async function getDescricoes(req, res) {
  requirePermissao(req, "sistema.visualizar_funcoes");
  const id = req.params.id;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa.");
  }

  const descricoes = await Descricao.findAll({
    where: { descricao_empresa_id: id },
    attributes: [
      "descricao_id",
      "descricao_setor_id",
      "descricao_treinamento",
      "descricao_escolaridade",
      "descricao_comportamentos",
      "descricao_tecnicas",
      "descricao_experiencia",
      "descricao_responsabilidades",
    ],
    include: [
      { model: Cargo, as: "cargo", attributes: ["cargo_nome"] },
      { model: Setor, as: "setor", attributes: ["setor_nome"] },
    ],
    order: [[{ model: Cargo, as: "cargo" }, "cargo_nome", "ASC"]],
  });

  return res.status(200).json(descricoes);
}

export async function putDescricao(req, res) {
  requirePermissao(req, "sistema.gerenciar_cargos");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;
  const {
    descricao_setor_id = "",
    descricao_escolaridade = "",
    descricao_treinamento = "",
    descricao_comportamento = "",
    descricao_tecnica = "",
    descricao_experiencia = "",
    descricao_responsabilidade = "",
  } = req.body;

  if (!id) {
    throw ApiError.badRequest("Necessário ID do da descrição a ser editada.");
  }

  const descricao = await Descricao.findByPk(id);

  descricao.descricao_setor_id =
    descricao_setor_id !== ""
      ? descricao_setor_id
      : descricao.descricao_setor_id;

  descricao.descricao_escolaridade = descricao_escolaridade;
  descricao.descricao_treinamento = descricao_treinamento;
  descricao.descricao_comportamentos = descricao_comportamento;
  descricao.descricao_tecnicas = descricao_tecnica;
  descricao.descricao_experiencia = descricao_experiencia;
  descricao.descricao_responsabilidades = descricao_responsabilidade;

  await descricao.save({ usuario_id });

  return res.status(200).json({ message: "Aumento aplicado com sucesso." });
}
