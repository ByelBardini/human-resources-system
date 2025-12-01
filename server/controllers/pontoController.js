import {
  Funcionario,
  Usuario,
  BatidaPonto,
  PerfilJornada,
  FuncionarioPerfilJornada,
  DiaTrabalhado,
  BancoHoras,
  Justificativa,
} from "../models/index.js";
import { Op } from "sequelize";
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

// Função para obter perfil de jornada do funcionário
export async function getPerfilJornada(funcionario_id) {
  const funcionario = await Funcionario.findByPk(funcionario_id, {
    include: [
      {
        model: PerfilJornada,
        as: "perfisJornada",
        through: FuncionarioPerfilJornada,
      },
    ],
  });

  if (!funcionario || !funcionario.perfisJornada || funcionario.perfisJornada.length === 0) {
    return null;
  }

  return funcionario.perfisJornada[0];
}

// Função para obter horas previstas do dia
export function getHorasPrevistasDia(perfil, data) {
  if (!perfil) return null;

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

  if (horas === 0) return null;

  return horas;
}

// Função para determinar próxima batida
function determinarProximaBatida(batidas) {
  if (batidas.length === 0) return "entrada";

  const ultimaBatida = batidas[batidas.length - 1];
  return ultimaBatida.batida_tipo === "entrada" ? "saida" : "entrada";
}

// Função para calcular horas trabalhadas
function calcularHorasTrabalhadas(batidas, intervaloMinimo) {
  if (batidas.length < 2) return 0;

  const entradas = batidas.filter((b) => b.batida_tipo === "entrada");
  const saidas = batidas.filter((b) => b.batida_tipo === "saida");

  let totalMinutos = 0;

  // Calcular períodos de trabalho (entrada -> saída)
  for (let i = 0; i < entradas.length; i++) {
    const entrada = new Date(entradas[i].batida_data_hora);
    const saida = saidas[i] ? new Date(saidas[i].batida_data_hora) : null;

    if (saida) {
      const diffMs = saida - entrada;
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      totalMinutos += diffMinutos;
    }
  }

  // Subtrair intervalos
  for (let i = 0; i < saidas.length - 1; i++) {
    const saida = new Date(saidas[i].batida_data_hora);
    const proximaEntrada = entradas[i + 1]
      ? new Date(entradas[i + 1].batida_data_hora)
      : null;

    if (proximaEntrada) {
      const diffMs = proximaEntrada - saida;
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      if (diffMinutos < intervaloMinimo) {
        totalMinutos -= diffMinutos;
      } else {
        totalMinutos -= intervaloMinimo;
      }
    }
  }

  return totalMinutos / 60; // Converter para horas
}

// Função para verificar divergências
function verificarDivergencias(batidas, horasPrevistas, intervaloMinimo, entradaPrevista, saidaPrevista) {
  const divergencias = [];

  // Verificar batidas faltantes
  const entradas = batidas.filter((b) => b.batida_tipo === "entrada");
  const saidas = batidas.filter((b) => b.batida_tipo === "saida");

  if (entradas.length === 0) {
    divergencias.push("Falta batida de entrada");
  }

  if (saidas.length === 0) {
    divergencias.push("Falta batida de saída");
  }

  if (entradas.length !== saidas.length) {
    divergencias.push("Número de batidas de entrada e saída não corresponde");
  }

  // Verificar entrada atrasada
  if (entradaPrevista && entradas.length > 0) {
    const entrada = new Date(entradas[0].batida_data_hora);
    const entradaPrev = new Date(entrada);
    entradaPrev.setHours(
      parseInt(entradaPrevista.split(":")[0]),
      parseInt(entradaPrevista.split(":")[1]),
      0
    );

    const diffMinutos = Math.floor((entrada - entradaPrev) / (1000 * 60));
    if (diffMinutos > 5) {
      divergencias.push(`Entrada atrasada em ${diffMinutos} minutos`);
    }
  }

  // Verificar saída antecipada
  if (saidaPrevista && saidas.length > 0) {
    const saida = new Date(saidas[saidas.length - 1].batida_data_hora);
    const saidaPrev = new Date(saida);
    saidaPrev.setHours(
      parseInt(saidaPrevista.split(":")[0]),
      parseInt(saidaPrevista.split(":")[1]),
      0
    );

    const diffMinutos = Math.floor((saidaPrev - saida) / (1000 * 60));
    if (diffMinutos > 5) {
      divergencias.push(`Saída antecipada em ${diffMinutos} minutos`);
    }
  }

  // Verificar intervalo mínimo
  for (let i = 0; i < saidas.length - 1; i++) {
    const saida = new Date(saidas[i].batida_data_hora);
    const proximaEntrada = entradas[i + 1]
      ? new Date(entradas[i + 1].batida_data_hora)
      : null;

    if (proximaEntrada) {
      const diffMs = proximaEntrada - saida;
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      if (diffMinutos < intervaloMinimo) {
        divergencias.push(`Intervalo menor que o mínimo (${diffMinutos} min < ${intervaloMinimo} min)`);
      }
    }
  }

  return divergencias;
}

// Função para calcular e salvar resumo do dia
export async function calcularESalvarDia(funcionario_id, data, batidas, perfil) {
  const horasPrevistas = getHorasPrevistasDia(perfil, data);
  const intervaloMinimo = perfil ? perfil.perfil_jornada_intervalo_minimo : 60;

  let entradaPrevista = null;
  let saidaPrevista = null;

  if (horasPrevistas && horasPrevistas > 0) {
    // Calcular horários previstos (assumindo início às 8h)
    const horas = Math.floor(horasPrevistas);
    const minutos = Math.round((horasPrevistas - horas) * 60);
    entradaPrevista = `08:00`;
    const saidaHora = 8 + horas;
    const saidaMin = minutos;
    saidaPrevista = `${String(saidaHora).padStart(2, "0")}:${String(saidaMin).padStart(2, "0")}`;
  }

  const horasTrabalhadas = calcularHorasTrabalhadas(batidas, intervaloMinimo);
  const horasExtras = horasPrevistas
    ? Math.max(0, horasTrabalhadas - horasPrevistas)
    : 0;
  const horasNegativas = horasPrevistas
    ? Math.max(0, horasPrevistas - horasTrabalhadas)
    : 0;

  // Tolerância de 5 minutos
  const horasExtrasAjustadas = horasExtras > 5 / 60 ? horasExtras : 0;
  const horasNegativasAjustadas = horasNegativas > 5 / 60 ? horasNegativas : 0;

  const divergencias = verificarDivergencias(
    batidas,
    horasPrevistas,
    intervaloMinimo,
    entradaPrevista,
    saidaPrevista
  );

  const status = divergencias.length > 0 || horasExtrasAjustadas > 0 || horasNegativasAjustadas > 0
    ? "divergente"
    : "normal";

  // Salvar ou atualizar dia trabalhado
  const [diaTrabalhado, created] = await DiaTrabalhado.upsert({
    dia_funcionario_id: funcionario_id,
    dia_data: data,
    dia_horas_trabalhadas: horasTrabalhadas,
    dia_horas_extras: horasExtrasAjustadas,
    dia_horas_negativas: horasNegativasAjustadas,
    dia_status: status,
    dia_entrada_prevista: entradaPrevista,
    dia_saida_prevista: saidaPrevista,
  });

  // Atualizar banco de horas
  const diferencaMinutos = Math.round((horasExtrasAjustadas - horasNegativasAjustadas) * 60);
  if (diferencaMinutos !== 0) {
    const [bancoHoras] = await BancoHoras.findOrCreate({
      where: { banco_funcionario_id: funcionario_id },
      defaults: { banco_saldo: 0 },
    });

    bancoHoras.banco_saldo += diferencaMinutos;
    await bancoHoras.save();
  }

  return diaTrabalhado;
}

// Registrar batida de ponto
export async function registrarBatida(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const agora = new Date();
  const dataAtual = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  // Buscar batidas do dia
  const inicioDia = new Date(dataAtual);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAtual);
  fimDia.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_funcionario_id: funcionario.funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const proximaBatida = determinarProximaBatida(batidas);

  // Criar nova batida
  const novaBatida = await BatidaPonto.create({
    batida_funcionario_id: funcionario.funcionario_id,
    batida_data_hora: agora,
    batida_tipo: proximaBatida,
  });

  // Recalcular dia
  const todasBatidas = [...batidas, novaBatida];
  const perfil = await getPerfilJornada(funcionario.funcionario_id);
  await calcularESalvarDia(
    funcionario.funcionario_id,
    dataAtual,
    todasBatidas,
    perfil
  );

  return res.status(201).json({
    batida: novaBatida,
    mensagem: `Batida de ${proximaBatida} registrada com sucesso`,
  });
}

// Obter dados do ponto do dia atual
export async function getPontoHoje(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const agora = new Date();
  const dataAtual = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const inicioDia = new Date(dataAtual);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAtual);
  fimDia.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_funcionario_id: funcionario.funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const perfil = await getPerfilJornada(funcionario.funcionario_id);
  const horasPrevistas = getHorasPrevistasDia(perfil, dataAtual);

  const diaTrabalhado = await DiaTrabalhado.findOne({
    where: {
      dia_funcionario_id: funcionario.funcionario_id,
      dia_data: dataAtual,
    },
  });

  const proximaBatida = determinarProximaBatida(batidas);

  return res.status(200).json({
    funcionario: {
      nome: funcionario.funcionario_nome,
    },
    dataAtual: dataAtual.toISOString().split("T")[0],
    jornadaPrevista: horasPrevistas ? `${horasPrevistas.toFixed(2)}h` : "Não definida",
    batidas: batidas.map((b) => ({
      id: b.batida_id,
      tipo: b.batida_tipo,
      dataHora: b.batida_data_hora,
    })),
    proximaBatida,
    resumo: diaTrabalhado
      ? {
          horasTrabalhadas: parseFloat(diaTrabalhado.dia_horas_trabalhadas || 0),
          horasExtras: parseFloat(diaTrabalhado.dia_horas_extras || 0),
          horasNegativas: parseFloat(diaTrabalhado.dia_horas_negativas || 0),
          status: diaTrabalhado.dia_status,
        }
      : null,
  });
}

// Obter batidas de um dia específico
export async function getBatidasDia(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const funcionario = await getFuncionarioDoUsuario(usuario_id);

  const { data } = req.query;
  if (!data) {
    throw ApiError.badRequest("Data é obrigatória");
  }

  const dataBusca = new Date(data);
  const inicioDia = new Date(dataBusca);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataBusca);
  fimDia.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_funcionario_id: funcionario.funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  return res.status(200).json({ batidas });
}

