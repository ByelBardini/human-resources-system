import {
  Funcionario,
  Usuario,
  Justificativa,
  BatidaPonto,
  DiaTrabalhado,
  PerfilJornada,
  FuncionarioPerfilJornada,
  BancoHoras,
} from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op } from "sequelize";
import {
  calcularESalvarDia,
  getPerfilJornada,
  getHorasPrevistasDia,
} from "./pontoController.js";

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

// Função auxiliar para obter funcionário do usuário logado
async function getFuncionarioDoUsuario(usuario_id) {
  const usuario = await Usuario.findByPk(usuario_id, {
    include: [
      {
        model: Funcionario,
        as: "funcionario",
      },
    ],
  });

  if (!usuario || !usuario.funcionario) {
    throw ApiError.badRequest("Usuário não está vinculado a um funcionário.");
  }

  return usuario.funcionario;
}

// Criar justificativa
export async function criarJustificativa(req, res) {
  requirePermissao(req, "registrar_ponto");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const { data, tipo, descricao } = req.body;
  const anexoCaminho = req.file ? req.file.path : null;

  if (!data || !tipo) {
    throw ApiError.badRequest("Data e tipo são obrigatórios");
  }

  // Verificar se o dia é divergente
  const dataJustificativa = new Date(data);
  const diaTrabalhado = await DiaTrabalhado.findOne({
    where: {
      dia_funcionario_id: funcionario.funcionario_id,
      dia_data: dataJustificativa,
    },
  });

  if (!diaTrabalhado || diaTrabalhado.dia_status !== "divergente") {
    throw ApiError.badRequest("Apenas dias divergentes podem ser justificados");
  }

  // Verificar se já existe justificativa pendente para este dia
  const justificativaExistente = await Justificativa.findOne({
    where: {
      justificativa_funcionario_id: funcionario.funcionario_id,
      justificativa_data: dataJustificativa,
      justificativa_status: "pendente",
    },
  });

  if (justificativaExistente) {
    throw ApiError.badRequest("Já existe uma justificativa pendente para este dia");
  }

  const justificativa = await Justificativa.create({
    justificativa_funcionario_id: funcionario.funcionario_id,
    justificativa_data: dataJustificativa,
    justificativa_tipo: tipo,
    justificativa_descricao: descricao,
    justificativa_anexo_caminho: anexoCaminho,
    justificativa_status: "pendente",
  });

  return res.status(201).json({ justificativa });
}

// Listar justificativas do funcionário
export async function listarJustificativas(req, res) {
  requirePermissao(req, "registrar_ponto");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const { mes, ano } = req.query;

  let whereClause = {
    justificativa_funcionario_id: funcionario.funcionario_id,
  };

  if (mes && ano) {
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0);
    whereClause.justificativa_data = {
      [Op.between]: [inicioMes, fimMes],
    };
  }

  const justificativas = await Justificativa.findAll({
    where: whereClause,
    order: [["justificativa_data", "DESC"]],
    include: [
      {
        model: Usuario,
        as: "aprovador",
        attributes: ["usuario_id", "usuario_nome"],
      },
    ],
  });

  return res.status(200).json({ justificativas });
}

// Aprovar justificativa
export async function aprovarJustificativa(req, res) {
  requirePermissao(req, "gerenciar_justificativas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;

  const justificativa = await Justificativa.findByPk(id, {
    include: [
      {
        model: Funcionario,
        as: "funcionario",
      },
    ],
  });

  if (!justificativa) {
    throw ApiError.notFound("Justificativa não encontrada");
  }

  if (justificativa.justificativa_status !== "pendente") {
    throw ApiError.badRequest("Apenas justificativas pendentes podem ser aprovadas");
  }

  justificativa.justificativa_status = "aprovada";
  justificativa.justificativa_aprovador_id = usuario_id;
  justificativa.justificativa_data_aprovacao = new Date();
  await justificativa.save();

  // Processar justificativa aprovada
  await processarJustificativaAprovada(justificativa);

  return res.status(200).json({
    justificativa,
    mensagem: "Justificativa aprovada com sucesso",
  });
}

// Recusar justificativa
export async function recusarJustificativa(req, res) {
  requirePermissao(req, "gerenciar_justificativas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;

  const justificativa = await Justificativa.findByPk(id);

  if (!justificativa) {
    throw ApiError.notFound("Justificativa não encontrada");
  }

  if (justificativa.justificativa_status !== "pendente") {
    throw ApiError.badRequest("Apenas justificativas pendentes podem ser recusadas");
  }

  justificativa.justificativa_status = "recusada";
  justificativa.justificativa_aprovador_id = usuario_id;
  justificativa.justificativa_data_aprovacao = new Date();
  await justificativa.save();

  return res.status(200).json({
    justificativa,
    mensagem: "Justificativa recusada",
  });
}

// Processar justificativa aprovada
async function processarJustificativaAprovada(justificativa) {
  const funcionario = await Funcionario.findByPk(justificativa.justificativa_funcionario_id);
  const data = new Date(justificativa.justificativa_data);
  const perfil = await getPerfilJornada(funcionario.funcionario_id);

  const inicioDia = new Date(data);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(data);
  fimDia.setHours(23, 59, 59, 999);

  const batidasExistentes = await BatidaPonto.findAll({
    where: {
      batida_funcionario_id: funcionario.funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const horasPrevistas = getHorasPrevistasDia(perfil, data);

  switch (justificativa.justificativa_tipo) {
    case "esqueceu_bater":
      // Criar batidas faltantes baseadas no horário previsto
      if (horasPrevistas && horasPrevistas > 0) {
        const entrada = new Date(data);
        entrada.setHours(8, 0, 0, 0);

        const saida = new Date(data);
        const horas = Math.floor(horasPrevistas);
        const minutos = Math.round((horasPrevistas - horas) * 60);
        saida.setHours(8 + horas, minutos, 0, 0);

        // Verificar se já existe batida de entrada
        const temEntrada = batidasExistentes.some((b) => b.batida_tipo === "entrada");
        if (!temEntrada) {
          await BatidaPonto.create({
            batida_funcionario_id: funcionario.funcionario_id,
            batida_data_hora: entrada,
            batida_tipo: "entrada",
            batida_justificativa_id: justificativa.justificativa_id,
          });
        }

        // Verificar se já existe batida de saída
        const temSaida = batidasExistentes.some((b) => b.batida_tipo === "saida");
        if (!temSaida) {
          await BatidaPonto.create({
            batida_funcionario_id: funcionario.funcionario_id,
            batida_data_hora: saida,
            batida_tipo: "saida",
            batida_justificativa_id: justificativa.justificativa_id,
          });
        }
      }
      break;

    case "entrada_atrasada":
      // Ajustar primeira batida de entrada para o horário previsto
      const primeiraEntrada = batidasExistentes.find((b) => b.batida_tipo === "entrada");
      if (primeiraEntrada && horasPrevistas) {
        const entrada = new Date(data);
        entrada.setHours(8, 0, 0, 0);
        primeiraEntrada.batida_data_hora = entrada;
        primeiraEntrada.batida_justificativa_id = justificativa.justificativa_id;
        await primeiraEntrada.save();
      }
      break;

    case "saida_cedo":
      // Ajustar última batida de saída para o horário previsto
      const ultimaSaida = batidasExistentes.filter((b) => b.batida_tipo === "saida").pop();
      if (ultimaSaida && horasPrevistas) {
        const saida = new Date(data);
        const horas = Math.floor(horasPrevistas);
        const minutos = Math.round((horasPrevistas - horas) * 60);
        saida.setHours(8 + horas, minutos, 0, 0);
        ultimaSaida.batida_data_hora = saida;
        ultimaSaida.batida_justificativa_id = justificativa.justificativa_id;
        await ultimaSaida.save();
      }
      break;

    case "horas_extras":
      // Apenas atualizar banco de horas (já será feito no recálculo)
      break;

    case "falta_justificada":
    case "consulta_medica":
      // Não criar batidas, apenas marcar como justificado
      break;

    case "falta_nao_justificada":
      // Não fazer nada, as horas ficam negativas
      break;

    default:
      break;
  }

  // Recalcular o dia
  const todasBatidas = await BatidaPonto.findAll({
    where: {
      batida_funcionario_id: funcionario.funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  await calcularESalvarDia(funcionario.funcionario_id, data, todasBatidas, perfil);
}

// Exportar função para uso interno
export { processarJustificativaAprovada };

