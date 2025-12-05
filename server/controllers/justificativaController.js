import {
  Usuario,
  Justificativa,
  BatidaPonto,
  DiaTrabalhado,
  PerfilJornada,
  BancoHoras,
  Notificacao,
} from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op } from "sequelize";
import {
  calcularESalvarDia,
  getPerfilJornadaUsuario,
  getHorasPrevistasDia,
  calcularHorasTrabalhadas,
} from "./pontoController.js";

// Constante para tolerância em minutos
const TOLERANCIA_MINUTOS = 10;

// Função para obter data/hora atual no fuso horário de Brasília
function getDataHoraBrasilia() {
  const agora = new Date();
  const dataBrasiliaStr = agora.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  return new Date(dataBrasiliaStr);
}

// Função para converter data DATEONLY (string YYYY-MM-DD) para objeto Date local sem problemas de timezone
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString().split('T')[0];
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Função para atualizar o status do dia após uma justificativa ser processada
// tipo: tipo da justificativa
// aprovada: se foi aprovada (true) ou recusada (false)
async function atualizarDiaAposJustificativa(diaTrabalhado, tipo, aprovada) {
  if (!diaTrabalhado) return;

  switch (tipo) {
    case "falta_justificada":
    case "consulta_medica":
      if (aprovada) {
        // Falta justificada aprovada: zerar horas (dia considera como 0, não conta negativo)
        diaTrabalhado.dia_horas_trabalhadas = 0;
        diaTrabalhado.dia_horas_extras = 0;
        diaTrabalhado.dia_horas_negativas = 0;
        diaTrabalhado.dia_status = "normal";
      } else {
        // Falta justificada recusada: manter horas negativas, mas não é mais divergente
        diaTrabalhado.dia_status = "normal";
      }
      break;

    case "falta_nao_justificada":
      // Falta não justificada: manter horas negativas, não é mais divergente
      diaTrabalhado.dia_status = "normal";
      break;

    case "horas_extras":
      // Horas extras (aprovada ou recusada): manter horas, não é mais divergente
      // Se recusada, as horas extras continuam contando mas terá aviso visual
      diaTrabalhado.dia_status = "normal";
      break;

    default:
      // Para outros tipos, apenas marcar como normal após processamento
      diaTrabalhado.dia_status = "normal";
      break;
  }

  diaTrabalhado.dia_ultima_atualizacao = getDataHoraBrasilia();
  await diaTrabalhado.save();
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

// Criar justificativa
export async function criarJustificativa(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const usuario = req.user;

  const { data, tipo, descricao } = req.body;
  const anexoCaminho = req.file ? req.file.path : null;

  if (!data || !tipo) {
    throw ApiError.badRequest("Data e tipo são obrigatórios");
  }

  // Verificar se o dia é divergente (calcular em tempo real)
  const dataJustificativa = parseDateOnly(data);
  
  // Buscar batidas do dia
  const inicioDia = new Date(dataJustificativa);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataJustificativa);
  fimDia.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
      batida_status: {
        [Op.in]: ["normal", "aprovada"],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(usuario_id);
  const horasPrevistas = getHorasPrevistasDia(perfil, dataJustificativa) || 0;

  // Calcular horas trabalhadas
  const horasTrabalhadas = calcularHorasTrabalhadas(batidas);

  // Calcular extras e negativas
  let horasExtras = horasPrevistas ? Math.max(0, horasTrabalhadas - horasPrevistas) : 0;
  let horasNegativas = horasPrevistas ? Math.max(0, horasPrevistas - horasTrabalhadas) : 0;

  // Aplicar tolerância
  const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
  horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
  horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

  // Verificar se é falta (dia sem batida)
  const hoje = getDataHoraBrasilia();
  if (dataJustificativa < hoje && horasPrevistas > 0 && batidas.length === 0) {
    horasNegativas = horasPrevistas;
  }

  // Determinar se é divergente
  const eDivergente = horasExtras > 0 || horasNegativas > 0;

  if (!eDivergente) {
    throw ApiError.badRequest("Apenas dias divergentes podem ser justificados");
  }

  // Verificar se já existe justificativa pendente para este dia
  const justificativaExistente = await Justificativa.findOne({
    where: {
      justificativa_usuario_id: usuario_id,
      justificativa_data: dataJustificativa,
      justificativa_status: "pendente",
    },
  });

  if (justificativaExistente) {
    throw ApiError.badRequest(
      "Já existe uma justificativa pendente para este dia"
    );
  }

  // Para falta não justificada: auto-aprovar e atualizar dia
  const ehFaltaNaoJustificada = tipo === "falta_nao_justificada";
  const statusInicial = ehFaltaNaoJustificada ? "aprovada" : "pendente";

  const justificativa = await Justificativa.create({
    justificativa_usuario_id: usuario_id,
    justificativa_data: dataJustificativa,
    justificativa_tipo: tipo,
    justificativa_descricao: descricao || (ehFaltaNaoJustificada ? "Falta não justificada registrada pelo funcionário" : null),
    justificativa_anexo_caminho: anexoCaminho,
    justificativa_status: statusInicial,
    justificativa_aprovador_id: ehFaltaNaoJustificada ? usuario_id : null,
    justificativa_data_aprovacao: ehFaltaNaoJustificada ? getDataHoraBrasilia() : null,
  });

  // Se for falta não justificada, atualizar o dia para "normal" mantendo as horas negativas
  if (ehFaltaNaoJustificada) {
    // Buscar ou criar registro na tabela DiaTrabalhado
    const [diaTrabalhado] = await DiaTrabalhado.findOrCreate({
      where: {
        dia_usuario_id: usuario_id,
        dia_data: dataJustificativa,
      },
      defaults: {
        dia_horas_trabalhadas: horasTrabalhadas,
        dia_horas_extras: horasExtras,
        dia_horas_negativas: horasNegativas,
        dia_status: "divergente",
      },
    });
    await atualizarDiaAposJustificativa(diaTrabalhado, tipo, true);
  }

  // Registrar automaticamente atestado em notificações se:
  // - Tipo for consulta_medica ou falta_justificada
  // - Tiver anexo
  // - Usuário tiver funcionario_id vinculado
  const tiposAtestado = ["consulta_medica", "falta_justificada"];
  if (tiposAtestado.includes(tipo) && anexoCaminho && usuario.usuario_funcionario_id) {
    try {
      // Formatar caminho para o padrão de notificações
      const notificacaoAnexo = anexoCaminho.replace("uploads\\justificativas\\", "/uploads/justificativas/")
        .replace("uploads/justificativas/", "/uploads/justificativas/");
      
      await Notificacao.create({
        notificacao_funcionario_id: usuario.usuario_funcionario_id,
        notificacao_tipo: "atestado",
        notificacao_data: dataJustificativa,
        notificacao_descricao: descricao || `Atestado anexado via justificativa de ponto (${tipo === "consulta_medica" ? "Consulta Médica" : "Falta Justificada"})`,
        notificacao_imagem_caminho: notificacaoAnexo,
      });
    } catch (err) {
      // Log do erro mas não falhar a criação da justificativa
      console.error("Erro ao registrar atestado automaticamente:", err);
    }
  }

  return res.status(201).json({ justificativa });
}

// Listar justificativas do usuário
export async function listarJustificativas(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

  const { mes, ano } = req.query;

  let whereClause = {
    justificativa_usuario_id: usuario_id,
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
  requirePermissao(req, "ponto.aprovar_justificativas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;

  const justificativa = await Justificativa.findByPk(id, {
    include: [
      {
        model: Usuario,
        as: "usuario",
      },
    ],
  });

  if (!justificativa) {
    throw ApiError.notFound("Justificativa não encontrada");
  }

  if (justificativa.justificativa_status !== "pendente") {
    throw ApiError.badRequest(
      "Apenas justificativas pendentes podem ser aprovadas"
    );
  }

  justificativa.justificativa_status = "aprovada";
  justificativa.justificativa_aprovador_id = usuario_id;
  justificativa.justificativa_data_aprovacao = getDataHoraBrasilia();
  await justificativa.save();

  // Buscar o dia trabalhado para atualizar
  const diaTrabalhado = await DiaTrabalhado.findOne({
    where: {
      dia_usuario_id: justificativa.justificativa_usuario_id,
      dia_data: justificativa.justificativa_data,
    },
  });

  // Atualizar status do dia conforme o tipo de justificativa
  await atualizarDiaAposJustificativa(diaTrabalhado, justificativa.justificativa_tipo, true);

  // Processar justificativa aprovada (para tipos que precisam criar batidas, etc.)
  if (!["falta_justificada", "consulta_medica", "falta_nao_justificada", "horas_extras"].includes(justificativa.justificativa_tipo)) {
    await processarJustificativaAprovada(justificativa, usuario_id);
  }

  return res.status(200).json({
    justificativa,
    mensagem: "Justificativa aprovada com sucesso",
  });
}

// Recusar justificativa
export async function recusarJustificativa(req, res) {
  requirePermissao(req, "ponto.aprovar_justificativas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;

  const justificativa = await Justificativa.findByPk(id);

  if (!justificativa) {
    throw ApiError.notFound("Justificativa não encontrada");
  }

  if (justificativa.justificativa_status !== "pendente") {
    throw ApiError.badRequest(
      "Apenas justificativas pendentes podem ser recusadas"
    );
  }

  justificativa.justificativa_status = "recusada";
  justificativa.justificativa_aprovador_id = usuario_id;
  justificativa.justificativa_data_aprovacao = getDataHoraBrasilia();
  await justificativa.save();

  // Buscar o dia trabalhado para atualizar
  const diaTrabalhado = await DiaTrabalhado.findOne({
    where: {
      dia_usuario_id: justificativa.justificativa_usuario_id,
      dia_data: justificativa.justificativa_data,
    },
  });

  // Atualizar status do dia (não é mais divergente, mas mantém as horas)
  await atualizarDiaAposJustificativa(diaTrabalhado, justificativa.justificativa_tipo, false);

  return res.status(200).json({
    justificativa,
    mensagem: "Justificativa recusada",
  });
}

// Processar justificativa aprovada
async function processarJustificativaAprovada(justificativa, aprovador_id) {
  const usuarioAlvo = await Usuario.findByPk(
    justificativa.justificativa_usuario_id
  );
  const usuario_id = usuarioAlvo.usuario_id;
  const data = new Date(justificativa.justificativa_data);
  const perfil = await getPerfilJornadaUsuario(usuario_id);

  const inicioDia = new Date(data);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(data);
  fimDia.setHours(23, 59, 59, 999);

  const batidasExistentes = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: usuario_id,
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
        const temEntrada = batidasExistentes.some(
          (b) => b.batida_tipo === "entrada"
        );
        if (!temEntrada) {
          await BatidaPonto.create({
            batida_usuario_id: usuario_id,
            batida_data_hora: entrada,
            batida_tipo: "entrada",
            batida_justificativa_id: justificativa.justificativa_id,
            batida_status: "aprovada",
            batida_aprovador_id: aprovador_id,
            batida_data_aprovacao: getDataHoraBrasilia(),
          });
        }

        // Verificar se já existe batida de saída
        const temSaida = batidasExistentes.some(
          (b) => b.batida_tipo === "saida"
        );
        if (!temSaida) {
          await BatidaPonto.create({
            batida_usuario_id: usuario_id,
            batida_data_hora: saida,
            batida_tipo: "saida",
            batida_justificativa_id: justificativa.justificativa_id,
            batida_status: "aprovada",
            batida_aprovador_id: aprovador_id,
            batida_data_aprovacao: getDataHoraBrasilia(),
          });
        }
      }
      break;

    case "entrada_atrasada":
      // Ajustar primeira batida de entrada para o horário previsto
      const primeiraEntrada = batidasExistentes.find(
        (b) => b.batida_tipo === "entrada"
      );
      if (primeiraEntrada && horasPrevistas) {
        const entrada = new Date(data);
        entrada.setHours(8, 0, 0, 0);
        primeiraEntrada.batida_data_hora = entrada;
        primeiraEntrada.batida_justificativa_id =
          justificativa.justificativa_id;
        await primeiraEntrada.save();
      }
      break;

    case "saida_cedo":
      // Ajustar última batida de saída para o horário previsto
      const ultimaSaida = batidasExistentes
        .filter((b) => b.batida_tipo === "saida")
        .pop();
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
      batida_usuario_id: usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  await calcularESalvarDia(usuario_id, data, todasBatidas, perfil);
}

// Exportar função para uso interno
export { processarJustificativaAprovada };
