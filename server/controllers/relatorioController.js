import {
  Usuario,
  DiaTrabalhado,
  Justificativa,
  BancoHoras,
  BatidaPonto,
  PerfilJornada,
} from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op } from "sequelize";

// Constante para tolerância em minutos
const TOLERANCIA_MINUTOS = 10;

// Função para calcular horas trabalhadas baseado nas batidas
// Lógica: (saída1 - entrada1) + (saída2 - entrada2) + ...
function calcularHorasTrabalhadas(batidas) {
  if (!batidas || batidas.length < 2) return 0;

  // Filtrar apenas batidas válidas (normal ou aprovada)
  const batidasValidas = batidas.filter(
    (b) => b.status !== "recusada" && b.status !== "pendente"
  );

  if (batidasValidas.length < 2) return 0;

  // Garantir que as batidas estão ordenadas por data/hora
  const batidasOrdenadas = [...batidasValidas].sort(
    (a, b) => new Date(a.dataHora) - new Date(b.dataHora)
  );

  let totalMinutos = 0;
  let ultimaEntrada = null;

  // Processar batidas em ordem cronológica
  for (const batida of batidasOrdenadas) {
    if (batida.tipo === "entrada") {
      ultimaEntrada = new Date(batida.dataHora);
    } else if (batida.tipo === "saida" && ultimaEntrada) {
      const saida = new Date(batida.dataHora);
      const diffMs = saida - ultimaEntrada;
      const diffMinutos = Math.floor(diffMs / (1000 * 60));

      if (diffMinutos > 0) {
        totalMinutos += diffMinutos;
      }

      ultimaEntrada = null;
    }
  }

  return totalMinutos / 60;
}

function getUsuarioId(req) {
  return req?.user?.usuario_id ?? null;
}

function requirePermissao(req, codigoPermissao) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized(
      "Necessário estar logado para realizar operações."
    );
  }
  const permissoes = usuario.permissoes || [];
  if (!permissoes.includes(codigoPermissao)) {
    throw ApiError.forbidden(
      `Você não tem permissão para realizar esta ação. Permissão necessária: ${codigoPermissao}`
    );
  }
  return usuario;
}

// Função para formatar data DATEONLY para string YYYY-MM-DD
function formatarDataStr(data) {
  if (!data) return null;
  // Se já for string, retornar
  if (typeof data === "string") return data.split("T")[0];
  // Se for Date, formatar
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

// Função para obter perfil de jornada do usuário
async function getPerfilJornadaUsuario(usuario_id) {
  const usuario = await Usuario.findByPk(usuario_id, {
    include: [
      {
        model: PerfilJornada,
        as: "perfilJornada",
      },
    ],
  });

  if (!usuario || !usuario.perfilJornada) {
    return null;
  }

  return usuario.perfilJornada;
}

// Função para obter horas previstas do dia baseado no perfil
function getHorasPrevistasDia(perfil, data) {
  if (!perfil) return 0;

  const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, etc.
  const diasMap = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };

  const campoDia = `perfil_jornada_${diasMap[diaSemana]}`;
  const horas = parseFloat(perfil[campoDia] || 0);

  return horas;
}

// Obter relatório mensal
export async function getRelatorioMensal(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(usuario_id);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_usuario_id: usuario_id,
      dia_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
    order: [["dia_data", "ASC"]],
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: usuario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
    order: [["justificativa_data", "DESC"]],
  });

  // Buscar batidas do mês
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(fimMes);
  fimDiaMes.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDiaMes, fimDiaMes],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Organizar batidas por dia
  const batidasPorDia = {};
  batidas.forEach((b) => {
    const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
    if (!batidasPorDia[dataStr]) {
      batidasPorDia[dataStr] = [];
    }
    batidasPorDia[dataStr].push({
      id: b.batida_id,
      tipo: b.batida_tipo,
      dataHora: b.batida_data_hora,
      status: b.batida_status,
    });
  });

  // Criar mapa de justificativas por data
  const justificativasPorData = {};
  justificativas.forEach((j) => {
    const dataStr = formatarDataStr(j.justificativa_data);
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

    // Buscar batidas do dia
    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistas = getHorasPrevistasDia(perfil, data);

    // Calcular horas trabalhadas em tempo real baseado nas batidas
    let horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

    // Calcular extras e negativas
    let horasExtras = horasPrevistas
      ? Math.max(0, horasTrabalhadas - horasPrevistas)
      : 0;
    let horasNegativas = horasPrevistas
      ? Math.max(0, horasPrevistas - horasTrabalhadas)
      : 0;

    // Aplicar tolerância de 10 minutos
    const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
    horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
    horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

    // Determinar status
    let status =
      horasExtras > 0 || horasNegativas > 0 ? "divergente" : "normal";

    // Verificar se é uma falta (dia sem batida que deveria ter trabalhado)
    // Se o dia já passou, deveria ter trabalhado (horasPrevistas > 0), não bateu ponto
    if (data < hoje && horasPrevistas > 0 && batidasDoDia.length === 0) {
      // É uma falta - considerar como horas negativas
      horasNegativas = horasPrevistas;
      status = "divergente";
    }

    const saldoDia = horasExtras - horasNegativas;

    diasDoMes.push({
      data: dataStr,
      horasTrabalhadas,
      horasExtras,
      horasNegativas,
      saldoDia,
      status,
      batidas: batidasDoDia,
      justificativas: justificativasPorData[dataStr] || [],
    });
  }

  return res.status(200).json({ dias: diasDoMes });
}

// Obter totais mensais
export async function getTotaisMensais(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_usuario_id: usuario_id,
      dia_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: usuario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
  });

  // Buscar batidas pendentes do mês
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(fimMes);
  fimDiaMes.setHours(23, 59, 59, 999);

  const batidasPendentes = await BatidaPonto.count({
    where: {
      batida_usuario_id: usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDiaMes, fimDiaMes],
      },
      batida_status: "pendente",
    },
  });

  const totais = {
    horasTrabalhadas: 0,
    horasExtras: 0,
    horasNegativas: 0,
    diasDivergentes: 0,
    justificativasPendentes: 0,
    justificativasAprovadas: 0,
    batidasPendentes,
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
    where: { banco_usuario_id: usuario_id },
  });

  const bancoHorasSaldo = bancoHoras
    ? bancoHoras.banco_saldo / 60 // Converter minutos para horas
    : 0;

  return res.status(200).json({
    ...totais,
    bancoHoras: bancoHorasSaldo,
  });
}
