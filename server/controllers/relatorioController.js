import {
  Funcionario,
  Usuario,
  DiaTrabalhado,
  Justificativa,
  BancoHoras,
} from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op } from "sequelize";

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

// Obter relatório mensal
export async function getRelatorioMensal(req, res) {
  requirePermissao(req, "visualizar_relatorios_ponto");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_funcionario_id: funcionario.funcionario_id,
      dia_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
    order: [["dia_data", "ASC"]],
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_funcionario_id: funcionario.funcionario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
    order: [["justificativa_data", "DESC"]],
  });

  // Criar mapa de justificativas por data
  const justificativasPorData = {};
  justificativas.forEach((j) => {
    const dataStr = j.justificativa_data.toISOString().split("T")[0];
    if (!justificativasPorData[dataStr]) {
      justificativasPorData[dataStr] = [];
    }
    justificativasPorData[dataStr].push(j);
  });

  // Criar array com todos os dias do mês
  const diasDoMes = [];
  for (let dia = 1; dia <= fimMes.getDate(); dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = data.toISOString().split("T")[0];
    const diaTrabalhado = diasTrabalhados.find(
      (d) => d.dia_data.toISOString().split("T")[0] === dataStr
    );

    diasDoMes.push({
      data: dataStr,
      horasTrabalhadas: diaTrabalhado
        ? parseFloat(diaTrabalhado.dia_horas_trabalhadas || 0)
        : 0,
      horasExtras: diaTrabalhado
        ? parseFloat(diaTrabalhado.dia_horas_extras || 0)
        : 0,
      horasNegativas: diaTrabalhado
        ? parseFloat(diaTrabalhado.dia_horas_negativas || 0)
        : 0,
      status: diaTrabalhado ? diaTrabalhado.dia_status : "normal",
      justificativas: justificativasPorData[dataStr] || [],
    });
  }

  return res.status(200).json({ dias: diasDoMes });
}

// Obter totais mensais
export async function getTotaisMensais(req, res) {
  requirePermissao(req, "visualizar_relatorios_ponto");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_funcionario_id: funcionario.funcionario_id,
      dia_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_funcionario_id: funcionario.funcionario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
  });

  const totais = {
    horasTrabalhadas: 0,
    horasExtras: 0,
    horasNegativas: 0,
    diasDivergentes: 0,
    justificativasPendentes: 0,
    justificativasAprovadas: 0,
  };

  diasTrabalhados.forEach((dia) => {
    totais.horasTrabalhadas += parseFloat(dia.dia_horas_trabalhadas || 0);
    totais.horasExtras += parseFloat(dia.dia_horas_extras || 0);
    totais.horasNegativas += parseFloat(dia.dia_horas_negativas || 0);
    if (dia.dia_status === "divergente") {
      totais.diasDivergentes++;
    }
  });

  justificativas.forEach((j) => {
    if (j.justificativa_status === "pendente") {
      totais.justificativasPendentes++;
    } else if (j.justificativa_status === "aprovada") {
      totais.justificativasAprovadas++;
    }
  });

  // Obter banco de horas
  const bancoHoras = await BancoHoras.findOne({
    where: { banco_funcionario_id: funcionario.funcionario_id },
  });

  const bancoHorasSaldo = bancoHoras
    ? bancoHoras.banco_saldo / 60 // Converter minutos para horas
    : 0;

  return res.status(200).json({
    ...totais,
    bancoHoras: bancoHorasSaldo,
  });
}

