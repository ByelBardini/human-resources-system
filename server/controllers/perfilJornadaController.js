import {
  PerfilJornada,
  FuncionarioPerfilJornada,
  Funcionario,
} from "../models/index.js";
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

// Criar perfil de jornada
export async function criarPerfilJornada(req, res) {
  requirePermissao(req, "gerenciar_perfis_jornada");

  const {
    nome,
    segunda,
    terca,
    quarta,
    quinta,
    sexta,
    sabado,
    domingo,
    intervaloMinimo,
  } = req.body;

  if (!nome) {
    throw ApiError.badRequest("Nome do perfil é obrigatório");
  }

  const perfil = await PerfilJornada.create({
    perfil_jornada_nome: nome,
    perfil_jornada_segunda: segunda || 0,
    perfil_jornada_terca: terca || 0,
    perfil_jornada_quarta: quarta || 0,
    perfil_jornada_quinta: quinta || 0,
    perfil_jornada_sexta: sexta || 0,
    perfil_jornada_sabado: sabado || 0,
    perfil_jornada_domingo: domingo || 0,
    perfil_jornada_intervalo_minimo: intervaloMinimo || 60,
  });

  return res.status(201).json({ perfil });
}

// Listar perfis de jornada
export async function listarPerfisJornada(req, res) {
  requirePermissao(req, "gerenciar_perfis_jornada");

  const perfis = await PerfilJornada.findAll({
    where: { perfil_jornada_ativo: 1 },
    order: [["perfil_jornada_nome", "ASC"]],
  });

  return res.status(200).json({ perfis });
}

// Listar perfis de jornada (sem permissão especial, para uso no cadastro)
export async function listarPerfisJornadaPublico(req, res) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized("Necessário estar logado para realizar operações.");
  }

  const perfis = await PerfilJornada.findAll({
    where: { perfil_jornada_ativo: 1 },
    order: [["perfil_jornada_nome", "ASC"]],
  });

  return res.status(200).json({ perfis });
}

// Vincular funcionário a perfil
export async function vincularFuncionarioPerfil(req, res) {
  requirePermissao(req, "gerenciar_perfis_jornada");

  const { funcionario_id, perfil_jornada_id } = req.body;

  if (!funcionario_id || !perfil_jornada_id) {
    throw ApiError.badRequest("Funcionário e perfil são obrigatórios");
  }

  // Verificar se funcionário existe
  const funcionario = await Funcionario.findByPk(funcionario_id);
  if (!funcionario) {
    throw ApiError.notFound("Funcionário não encontrado");
  }

  // Verificar se perfil existe
  const perfil = await PerfilJornada.findByPk(perfil_jornada_id);
  if (!perfil) {
    throw ApiError.notFound("Perfil de jornada não encontrado");
  }

  // Remover vínculo anterior se existir
  await FuncionarioPerfilJornada.destroy({
    where: { funcionario_id },
  });

  // Criar novo vínculo
  const vinculo = await FuncionarioPerfilJornada.create({
    funcionario_id,
    perfil_jornada_id,
  });

  return res.status(201).json({ vinculo });
}

