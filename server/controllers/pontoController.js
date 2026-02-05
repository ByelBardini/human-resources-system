import path from "path";
import {
  Usuario,
  BatidaPonto,
  PerfilJornada,
  DiaTrabalhado,
  BancoHoras,
  Justificativa,
  Empresa,
  Feriado,
  Ferias,
  Funcionario,
  Notificacao,
} from "../models/index.js";
import { Op } from "sequelize";
import { ApiError } from "../middlewares/ApiError.js";
import { formatarHorasParaHHMM } from "../utils/formatarHoras.js";
import { verificarECriarFalta } from "./justificativaController.js";

// Constante para tolerância em minutos
const TOLERANCIA_MINUTOS = 10;

// Função para obter data/hora atual no fuso horário de Brasília
function getDataHoraBrasilia() {
  const agora = new Date();
  // Converte para string no fuso de Brasília e depois cria novo Date
  const dataBrasiliaStr = agora.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  return new Date(dataBrasiliaStr);
}

// Função para obter apenas a data (sem hora) no fuso de Brasília
function getDataBrasilia(date = new Date()) {
  const dataBrasiliaStr = date.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  const dataBrasilia = new Date(dataBrasiliaStr);
  return new Date(
    dataBrasilia.getFullYear(),
    dataBrasilia.getMonth(),
    dataBrasilia.getDate()
  );
}

// Função para formatar data DATEONLY para string YYYY-MM-DD
function formatarDataStr(data) {
  if (!data) return null;
  // Se já for string no formato correto, retornar
  if (typeof data === "string") return data.split("T")[0];
  // Se for Date, formatar
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

// Função para converter data DATEONLY (string YYYY-MM-DD) para objeto Date local sem problemas de timezone
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str =
    typeof dateStr === "string" ? dateStr : dateStr.toISOString().split("T")[0];
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
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

// Função para obter perfil de jornada do usuário
export async function getPerfilJornadaUsuario(usuario_id) {
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

// Função para verificar se uma data é feriado ou domingo
async function isFeriadoOuDomingo(usuario_id, data) {
  // Verificar se é domingo (0 = domingo)
  const dataBrasilia = getDataBrasilia(data);
  const diaSemana = dataBrasilia.getDay();
  if (diaSemana === 0) {
    return true;
  }

  // Formatar data como YYYY-MM-DD
  const dataStr = formatarDataStr(dataBrasilia);

  // Buscar empresa do usuário
  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_empresa_id"],
  });

  const empresa_id = usuario?.usuario_empresa_id || null;

  // Verificar se existe feriado nacional para a data
  const feriadoNacional = await Feriado.findOne({
    where: {
      feriado_data: dataStr,
      feriado_tipo: "nacional",
      feriado_ativo: 1,
    },
  });

  if (feriadoNacional) {
    return true;
  }

  // Verificar se existe feriado da empresa para a data
  if (empresa_id) {
    const feriadoEmpresa = await Feriado.findOne({
      where: {
        feriado_data: dataStr,
        feriado_tipo: "empresa",
        feriado_empresa_id: empresa_id,
        feriado_ativo: 1,
      },
    });

    if (feriadoEmpresa) {
      return true;
    }
  }

  return false;
}

// Função para obter nome do feriado de uma data (retorna null se não for feriado)
async function getNomeFeriado(usuario_id, data) {
  // Verificar se é domingo (0 = domingo)
  const dataBrasilia = getDataBrasilia(data);
  const diaSemana = dataBrasilia.getDay();
  if (diaSemana === 0) {
    return "Domingo";
  }

  // Formatar data como YYYY-MM-DD
  const dataStr = formatarDataStr(dataBrasilia);

  // Buscar empresa do usuário
  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_empresa_id"],
  });

  const empresa_id = usuario?.usuario_empresa_id || null;

  // Verificar se existe feriado nacional para a data
  const feriadoNacional = await Feriado.findOne({
    where: {
      feriado_data: dataStr,
      feriado_tipo: "nacional",
      feriado_ativo: 1,
    },
  });

  if (feriadoNacional) {
    return feriadoNacional.feriado_nome;
  }

  // Verificar se existe feriado da empresa para a data
  if (empresa_id) {
    const feriadoEmpresa = await Feriado.findOne({
      where: {
        feriado_data: dataStr,
        feriado_tipo: "empresa",
        feriado_empresa_id: empresa_id,
        feriado_ativo: 1,
      },
    });

    if (feriadoEmpresa) {
      return feriadoEmpresa.feriado_nome;
    }
  }

  return null;
}

// Função para verificar se uma data está dentro de um período de férias aprovado
async function getFeriasPeriodo(usuario_id, data) {
  const dataBrasilia = getDataBrasilia(data);
  const dataStr = formatarDataStr(dataBrasilia);
  const ferias = await Ferias.findOne({
    where: {
      ferias_usuario_id: usuario_id,
      ferias_status: "aprovada",
      ferias_ativo: 1,
      ferias_data_inicio: { [Op.lte]: dataStr },
      ferias_data_fim: { [Op.gte]: dataStr },
    },
    order: [["ferias_data_inicio", "DESC"]],
  });
  if (!ferias) return null;
  return {
    data_inicio: ferias.ferias_data_inicio,
    data_fim: ferias.ferias_data_fim,
  };
}

async function isEmFerias(usuario_id, data) {
  const periodo = await getFeriasPeriodo(usuario_id, data);
  return !!periodo;
}

// Função para obter período de atestado ativo (retorna null se não houver)
async function getAtestadoPeriodo(usuario_id, data) {
  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_funcionario_id"],
  });
  if (!usuario?.usuario_funcionario_id) return null;

  const dataBrasilia = getDataBrasilia(data);
  const dataStr = formatarDataStr(dataBrasilia);

  const atestado = await Notificacao.findOne({
    where: {
      notificacao_funcionario_id: usuario.usuario_funcionario_id,
      notificacao_tipo: "atestado",
      notificacao_data: { [Op.lte]: dataStr },
      notificacao_data_final: { [Op.gte]: dataStr },
    },
    order: [["notificacao_data", "DESC"]],
  });

  if (!atestado) return null;
  return {
    data_inicio: atestado.notificacao_data,
    data_fim: atestado.notificacao_data_final,
  };
}

// Função para verificar se o usuário está em período de atestado médico
async function isEmAtestado(usuario_id, data) {
  const periodo = await getAtestadoPeriodo(usuario_id, data);
  return !!periodo;
}

// Função para verificar se o funcionário está em período de atestado (por funcionario_id)
async function isEmAtestadoPorFuncionario(funcionario_id, data) {
  if (!funcionario_id) return false;
  const dataStr = formatarDataStr(getDataBrasilia(data));
  const atestado = await Notificacao.findOne({
    where: {
      notificacao_funcionario_id: funcionario_id,
      notificacao_tipo: "atestado",
      notificacao_data: { [Op.lte]: dataStr },
      notificacao_data_final: { [Op.gte]: dataStr },
    },
  });
  return !!atestado;
}

// Função para obter horas previstas do dia
export function getHorasPrevistasDia(perfil, data) {
  if (!perfil) return null;

  // Converter para data de Brasília para pegar o dia da semana correto
  const dataBrasilia = getDataBrasilia(data);
  const diaSemana = dataBrasilia.getDay(); // 0 = domingo, 1 = segunda, etc.
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

// Função para calcular horas trabalhadas (sem intervalo mínimo)
// Lógica: (saída1 - entrada1) + (saída2 - entrada2) + ...
export function calcularHorasTrabalhadas(batidas) {
  if (batidas.length < 2) return 0;

  // Garantir que as batidas estão ordenadas por data/hora
  const batidasOrdenadas = [...batidas].sort(
    (a, b) => new Date(a.batida_data_hora) - new Date(b.batida_data_hora)
  );

  let totalMinutos = 0;
  let ultimaEntrada = null;

  // Processar batidas em ordem cronológica
  for (const batida of batidasOrdenadas) {
    if (batida.batida_tipo === "entrada") {
      // Guardar a entrada mais recente
      ultimaEntrada = new Date(batida.batida_data_hora);
    } else if (batida.batida_tipo === "saida" && ultimaEntrada) {
      // Calcular diferença entre saída e última entrada
      const saida = new Date(batida.batida_data_hora);
      const diffMs = saida - ultimaEntrada;
      const diffMinutos = Math.floor(diffMs / (1000 * 60));

      // Só adicionar se a diferença for positiva
      if (diffMinutos > 0) {
        totalMinutos += diffMinutos;
      }

      // Reset para próximo par entrada/saída
      ultimaEntrada = null;
    }
  }

  return totalMinutos / 60; // Converter para horas
}

// Função para verificar divergências (tolerância de 10 minutos)
function verificarDivergencias(
  batidas,
  horasPrevistas,
  entradaPrevista,
  saidaPrevista
) {
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

  // Verificar entrada atrasada (tolerância de 10 minutos)
  if (entradaPrevista && entradas.length > 0) {
    const entrada = new Date(entradas[0].batida_data_hora);
    const entradaPrev = new Date(entrada);
    entradaPrev.setHours(
      parseInt(entradaPrevista.split(":")[0]),
      parseInt(entradaPrevista.split(":")[1]),
      0
    );

    const diffMinutos = Math.floor((entrada - entradaPrev) / (1000 * 60));
    if (diffMinutos > TOLERANCIA_MINUTOS) {
      divergencias.push(`Entrada atrasada em ${diffMinutos} minutos`);
    }
  }

  // Verificar saída antecipada (tolerância de 10 minutos)
  if (saidaPrevista && saidas.length > 0) {
    const saida = new Date(saidas[saidas.length - 1].batida_data_hora);
    const saidaPrev = new Date(saida);
    saidaPrev.setHours(
      parseInt(saidaPrevista.split(":")[0]),
      parseInt(saidaPrevista.split(":")[1]),
      0
    );

    const diffMinutos = Math.floor((saidaPrev - saida) / (1000 * 60));
    if (diffMinutos > TOLERANCIA_MINUTOS) {
      divergencias.push(`Saída antecipada em ${diffMinutos} minutos`);
    }
  }

  return divergencias;
}

// Função para calcular e salvar resumo do dia
export async function calcularESalvarDia(usuario_id, data, batidas, perfil) {
  // Verificar se é feriado/domingo, férias ou atestado
  const eFeriadoOuDomingo = await isFeriadoOuDomingo(usuario_id, data);
  const eEmFerias = await isEmFerias(usuario_id, data);
  const eEmAtestado = await isEmAtestado(usuario_id, data);
  const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;

  let horasPrevistas = null;
  let entradaPrevista = null;
  let saidaPrevista = null;

  if (!eDiaNaoUtil) {
    horasPrevistas = getHorasPrevistasDia(perfil, data);

    if (horasPrevistas && horasPrevistas > 0) {
      // Calcular horários previstos (assumindo início às 8h)
      const horas = Math.floor(horasPrevistas);
      const minutos = Math.round((horasPrevistas - horas) * 60);
      entradaPrevista = `08:00`;
      const saidaHora = 8 + horas;
      const saidaMin = minutos;
      saidaPrevista = `${String(saidaHora).padStart(2, "0")}:${String(
        saidaMin
      ).padStart(2, "0")}`;
    }
  }

  // Filtrar apenas batidas válidas (não recusadas e não pendentes)
  const batidasValidas = batidas.filter(
    (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
  );

  const horasTrabalhadas = calcularHorasTrabalhadas(batidasValidas);

  let horasExtras = 0;
  let horasNegativas = 0;

  if (eFeriadoOuDomingo) {
    // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
    horasExtras = horasTrabalhadas * 2;
    horasNegativas = 0;
  } else if (eEmFerias || eEmAtestado) {
    // Em férias ou atestado: não considerar horas negativas
    horasExtras = horasTrabalhadas;
    horasNegativas = 0;
  } else {
    // Em dias normais: calcular normalmente
    if (horasPrevistas === null || horasPrevistas === 0) {
      // Se não há horas previstas, todas as horas trabalhadas são extras
      horasExtras = horasTrabalhadas;
      horasNegativas = 0;
    } else {
      horasExtras = Math.max(0, horasTrabalhadas - horasPrevistas);
      horasNegativas = Math.max(0, horasPrevistas - horasTrabalhadas);
    }
  }

  // Tolerância de 10 minutos (apenas para dias normais, não aplica em feriados/domingos)
  const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
  const horasExtrasAjustadas = eDiaNaoUtil
    ? horasExtras
    : (horasPrevistas === null || horasPrevistas === 0)
    ? horasExtras // Se não há horas previstas, não aplicar tolerância
    : horasExtras > toleranciaHoras
    ? horasExtras
    : 0;
  let horasNegativasAjustadas = eDiaNaoUtil
    ? 0
    : horasNegativas > toleranciaHoras
    ? horasNegativas
    : 0;

  // Verificar se há justificativa aprovada para este dia (exceto falta_nao_justificada e horas_extras)
  // Se houver, zerar as horas negativas (falta justificada e aprovada)
  const dataStr = formatarDataStr(data);
  const justificativaAprovada = await Justificativa.findOne({
    where: {
      justificativa_usuario_id: usuario_id,
      justificativa_data: dataStr,
      justificativa_status: "aprovada",
      justificativa_tipo: {
        [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
      },
    },
  });

  // Se houver justificativa aprovada (exceto falta_nao_justificada), zerar horas negativas
  if (justificativaAprovada) {
    horasNegativasAjustadas = 0;
  }

  const divergencias = verificarDivergencias(
    batidasValidas,
    horasPrevistas,
    entradaPrevista,
    saidaPrevista
  );

  // Em feriados/domingos, não considerar horas extras como divergência
  const status =
    divergencias.length > 0 ||
    (!eFeriadoOuDomingo && (horasExtrasAjustadas > 0 || horasNegativasAjustadas > 0))
      ? "divergente"
      : "normal";

  // Buscar dia anterior para calcular diferença
  const diaAnterior = await DiaTrabalhado.findOne({
    where: {
      dia_usuario_id: usuario_id,
      dia_data: data,
    },
  });

  const horasExtrasAnterior = diaAnterior
    ? parseFloat(diaAnterior.dia_horas_extras || 0)
    : 0;
  const horasNegativasAnterior = diaAnterior
    ? parseFloat(diaAnterior.dia_horas_negativas || 0)
    : 0;

  // Salvar ou atualizar dia trabalhado
  await DiaTrabalhado.upsert({
    dia_usuario_id: usuario_id,
    dia_data: data,
    dia_horas_trabalhadas: horasTrabalhadas,
    dia_horas_extras: horasExtrasAjustadas,
    dia_horas_negativas: horasNegativasAjustadas,
    dia_status: status,
    dia_entrada_prevista: entradaPrevista,
    dia_saida_prevista: saidaPrevista,
  });

  // Calcular diferença para atualizar banco de horas
  const diferencaAnterior = Math.round(
    (horasExtrasAnterior - horasNegativasAnterior) * 60
  );
  const diferencaNova = Math.round(
    (horasExtrasAjustadas - horasNegativasAjustadas) * 60
  );
  const ajusteBanco = diferencaNova - diferencaAnterior;

  if (ajusteBanco !== 0) {
    const [bancoHoras] = await BancoHoras.findOrCreate({
      where: { banco_usuario_id: usuario_id },
      defaults: { banco_saldo: 0 },
    });

    bancoHoras.banco_saldo += ajusteBanco;
    bancoHoras.banco_ultima_atualizacao = new Date();
    await bancoHoras.save();
  }

  return await DiaTrabalhado.findOne({
    where: {
      dia_usuario_id: usuario_id,
      dia_data: data,
    },
  });
}

// Registrar batida de ponto
export async function registrarBatida(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const usuarioCompleto = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_id", "usuario_funcionario_id"],
    include: [
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_batida_fora_empresa"],
      },
    ],
  });

  const exigeFoto =
    usuarioCompleto?.funcionario?.funcionario_batida_fora_empresa === 1;

  if (exigeFoto && !req.file) {
    throw ApiError.badRequest("Foto obrigatoria para batida fora da empresa.");
  }

  const fotoPath = req.file ? `/uploads/batidas/${req.file.filename}` : null;

  // Usar fuso horário de Brasília
  const agora = getDataHoraBrasilia();
  const dataAtual = getDataBrasilia(agora);

  const emFerias = await isEmFerias(usuario_id, dataAtual);
  if (emFerias) {
    throw ApiError.badRequest("Usuário está em férias e não pode registrar ponto.");
  }

  const emAtestado = await isEmAtestado(usuario_id, dataAtual);
  if (emAtestado) {
    throw ApiError.badRequest(
      "Usuário está em período de atestado médico e não pode registrar ponto."
    );
  }

  // Buscar batidas do dia
  const inicioDia = new Date(dataAtual);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAtual);
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

  const proximaBatida = determinarProximaBatida(batidas);

  // Criar nova batida (status normal pois é batida automática)
  const novaBatida = await BatidaPonto.create({
    batida_usuario_id: usuario_id,
    batida_data_hora: agora,
    batida_tipo: proximaBatida,
    batida_status: "normal",
    ...(fotoPath ? { batida_foto_caminho: fotoPath } : {}),
  });

  // Recalcular dia
  const todasBatidas = [...batidas, novaBatida];
  const perfil = await getPerfilJornadaUsuario(usuario_id);
  await calcularESalvarDia(usuario_id, dataAtual, todasBatidas, perfil);

  return res.status(201).json({
    batida: novaBatida,
    mensagem: `Batida de ${proximaBatida} registrada com sucesso`,
  });
}

// Obter dados do ponto do dia atual
export async function getPontoHoje(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const usuario = req.user;

  // Usar fuso horário de Brasília
  const agora = getDataHoraBrasilia();
  const dataAtual = getDataBrasilia(agora);

  const inicioDia = new Date(dataAtual);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAtual);
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

  const perfil = await getPerfilJornadaUsuario(usuario_id);
  
  // Verificar se é feriado
  const nomeFeriado = await getNomeFeriado(usuario_id, dataAtual);
  const eFeriadoOuDomingo = nomeFeriado !== null;
  const feriasPeriodo = await getFeriasPeriodo(usuario_id, dataAtual);
  const emFerias = !!feriasPeriodo;
  const atestadoPeriodo = await getAtestadoPeriodo(usuario_id, dataAtual);
  const emAtestado = !!atestadoPeriodo;
  const eDiaNaoUtil = eFeriadoOuDomingo || emFerias || emAtestado;
  const horasPrevistas = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, dataAtual);

  // Calcular horas trabalhadas em tempo real baseado nas batidas válidas
  const horasTrabalhadasCalculadas = calcularHorasTrabalhadas(batidas);

  // Calcular extras e negativas
  let horasExtrasCalculadas = 0;
  let horasNegativasCalculadas = 0;

  if (eFeriadoOuDomingo) {
    // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
    horasExtrasCalculadas = horasTrabalhadasCalculadas * 2;
    horasNegativasCalculadas = 0;
  } else if (emFerias || emAtestado) {
    // Em férias ou atestado: não considerar horas negativas
    horasExtrasCalculadas = horasTrabalhadasCalculadas;
    horasNegativasCalculadas = 0;
  } else {
    if (horasPrevistas === null || horasPrevistas === 0) {
      // Se não há horas previstas, todas as horas trabalhadas são extras
      horasExtrasCalculadas = horasTrabalhadasCalculadas;
      horasNegativasCalculadas = 0;
    } else {
      horasExtrasCalculadas = Math.max(0, horasTrabalhadasCalculadas - horasPrevistas);
      horasNegativasCalculadas = Math.max(0, horasPrevistas - horasTrabalhadasCalculadas);
    }
  }

  // Aplicar tolerância de 10 minutos (apenas para dias normais com horas previstas)
  const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
  const horasExtrasAjustadas = eDiaNaoUtil || (horasPrevistas === null || horasPrevistas === 0)
    ? horasExtrasCalculadas // Em feriados ou sem horas previstas, não aplicar tolerância
    : horasExtrasCalculadas > toleranciaHoras ? horasExtrasCalculadas : 0;
  const horasNegativasAjustadas = eDiaNaoUtil || (horasPrevistas === null || horasPrevistas === 0)
    ? 0
    : horasNegativasCalculadas > toleranciaHoras ? horasNegativasCalculadas : 0;

  // Determinar status
  const statusCalculado =
    horasExtrasAjustadas > 0 || horasNegativasAjustadas > 0
      ? "divergente"
      : "normal";

  const proximaBatida = determinarProximaBatida(batidas);

  // Calcular saldo do banco de horas ACUMULADO (desde a data de início até hoje)
  const usuarioCompleto = await Usuario.findByPk(usuario_id, {
    include: [
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_batida_fora_empresa"],
      },
    ],
  });
  const dataCriacaoUsuario = usuarioCompleto?.usuario_data_criacao
    ? parseDateOnly(usuarioCompleto.usuario_data_criacao)
    : null;
  const batidaForaEmpresa =
    usuarioCompleto?.funcionario?.funcionario_batida_fora_empresa === 1;

  const mesAtual = dataAtual.getMonth() + 1;
  const anoAtual = dataAtual.getFullYear();

  // Buscar banco de horas para obter data de início
  const bancoHorasRecord = await BancoHoras.findOne({
    where: { banco_usuario_id: usuario_id },
  });

  // Definir data de início do cálculo do banco (última zeragem ou criação do usuário)
  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHorasRecord?.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHorasRecord.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  // Calcular o banco de horas acumulado de todos os meses desde dataInicioBanco até hoje
  let saldoBancoHoras = 0;

  // Iterar por todos os meses desde dataInicioBanco até o mês atual
  let mesCursor = new Date(
    dataInicioBanco.getFullYear(),
    dataInicioBanco.getMonth(),
    1
  );
  const fimConsulta = new Date(anoAtual, mesAtual - 1, 1);

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    // Definir período do mês
    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);

    // Verificar se é o mês atual (para limitar até hoje)
    const eMesAtualCursor =
      mesCursorNum === mesAtual && anoCursorNum === anoAtual;
    const dataLimiteCursor = eMesAtualCursor ? dataAtual : fimMesCursor;
    const ultimoDiaCursor = eMesAtualCursor
      ? dataAtual.getDate()
      : fimMesCursor.getDate();

    // Calcular primeiro dia válido deste mês
    let primeiroDiaCursor = 1;
    if (
      dataInicioBanco.getFullYear() === anoCursorNum &&
      dataInicioBanco.getMonth() + 1 === mesCursorNum
    ) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    // Buscar batidas do mês
    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: usuario_id,
        batida_data_hora: {
          [Op.between]: [
            inicioMesCursor,
            new Date(
              dataLimiteCursor.getFullYear(),
              dataLimiteCursor.getMonth(),
              dataLimiteCursor.getDate(),
              23,
              59,
              59,
              999
            ),
          ],
        },
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    // Organizar batidas por dia
    const batidasPorDiaMes = {};
    batidasMes.forEach((b) => {
      const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
      if (!batidasPorDiaMes[dataStr]) batidasPorDiaMes[dataStr] = [];
      batidasPorDiaMes[dataStr].push(b);
    });

    // Buscar justificativas aprovadas do mês (exceto falta_nao_justificada e horas_extras)
    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: usuario_id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: {
          [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
        },
      },
    });
    const diasJustificados = new Set(
      justificativasMes.map((j) => {
        const data = j.justificativa_data;
        // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
        return typeof data === "string"
          ? data
          : new Date(data).toISOString().split("T")[0];
      })
    );

    // Calcular horas do mês
    const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
    
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const dataDia = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = dataDia.toISOString().split("T")[0];

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      
      // Filtrar apenas batidas válidas (não recusadas e não pendentes)
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );
      
      // Verificar se é feriado/domingo, férias ou atestado
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(usuario_id, dataDia);
      const eEmFerias = await isEmFerias(usuario_id, dataDia);
      const eEmAtestado = await isEmAtestado(usuario_id, dataDia);
      const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;
      const horasPrevistasDia = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, dataDia);

      // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), não conta horas negativas
      if (diasJustificados.has(dataStr)) {
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasValidasDoDia);

      let horasExtrasDia = 0;
      let horasNegativasDia = 0;

      if (eFeriadoOuDomingo) {
        // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
        horasExtrasDia = horasTrabalhadasDia * 2;
        horasNegativasDia = 0;
      } else if (eEmFerias || eEmAtestado) {
        // Em férias: não considerar horas negativas
        horasExtrasDia = horasTrabalhadasDia;
        horasNegativasDia = 0;
      } else {
        if (horasPrevistasDia === null || horasPrevistasDia === 0) {
          // Se não há horas previstas, todas as horas trabalhadas são extras
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistasDia);
          horasNegativasDia = Math.max(0, horasPrevistasDia - horasTrabalhadasDia);

          // Aplicar tolerância
          horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia =
            horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          // Verificar falta (dia sem batida que deveria ter trabalhado)
          if (
            dataDia < dataAtual &&
            horasPrevistasDia > 0 &&
            batidasValidasDoDia.length === 0
          ) {
            horasNegativasDia = horasPrevistasDia;
          }
        }
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const dataAtualStr = dataAtual.toISOString().split("T")[0];
      const eDiaAtual = dataStr === dataAtualStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
        );
        const saidasDoDia = batidasValidasDoDia.filter(
          (b) => b.batida_tipo === "saida"
        );
        deveIncluirNoBanco = saidasDoDia.length >= 2;
      }

      // Somar ao banco de horas apenas se atender os critérios
      if (deveIncluirNoBanco) {
        saldoBancoHoras += horasExtrasDia - horasNegativasDia;
      }
    }

    // Avançar para o próximo mês
    mesCursor = new Date(mesCursor.getFullYear(), mesCursor.getMonth() + 1, 1);
  }

  return res.status(200).json({
    funcionario: {
      nome: usuario.usuario_nome,
      batida_fora_empresa: batidaForaEmpresa,
    },
    dataAtual: dataAtual.toISOString().split("T")[0],
    jornadaPrevista: horasPrevistas
      ? formatarHorasParaHHMM(horasPrevistas)
      : "Não definida",
    feriado: nomeFeriado || null,
    emFerias,
    ferias: feriasPeriodo,
    emAtestado,
    atestado: atestadoPeriodo,
    batidas: batidas.map((b) => ({
      id: b.batida_id,
      tipo: b.batida_tipo,
      dataHora: b.batida_data_hora,
      status: b.batida_status,
      alterada: Boolean(b.batida_alterada),
      alteradoEm: b.batida_data_alteracao || null,
    })),
    proximaBatida,
    resumo:
      batidas.length > 0
        ? {
            horasTrabalhadas: horasTrabalhadasCalculadas,
            horasExtras: horasExtrasAjustadas,
            status: statusCalculado,
          }
        : null,
    bancoHoras: saldoBancoHoras,
  });
}

// Obter batidas de um dia específico
export async function getBatidasDia(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

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
      batida_usuario_id: usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  return res.status(200).json({ batidas });
}

// Obter saldo do banco de horas
export async function getBancoHoras(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

  const bancoHoras = await BancoHoras.findOne({
    where: { banco_usuario_id: usuario_id },
  });

  const saldoMinutos = bancoHoras ? bancoHoras.banco_saldo : 0;
  const saldoHoras = saldoMinutos / 60;

  return res.status(200).json({
    saldoMinutos,
    saldoHoras,
    ultimaAtualizacao: bancoHoras ? bancoHoras.banco_ultima_atualizacao : null,
  });
}

// Adicionar batida manual (pendente de aprovação ou aprovada se usuário tem permissão)
export async function adicionarBatidaManual(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  // Verificar se usuário pode aprovar batidas (nesse caso, batida já entra como aprovada)
  const podeAprovar = permissoes.includes("ponto.alterar_batidas");

  const { data_hora, tipo, observacao, para_usuario_id } = req.body;

  if (!data_hora || !tipo) {
    throw ApiError.badRequest("Data/hora e tipo são obrigatórios");
  }

  if (!["entrada", "saida"].includes(tipo)) {
    throw ApiError.badRequest("Tipo deve ser 'entrada' ou 'saida'");
  }

  if (!observacao || observacao.trim() === "") {
    throw ApiError.badRequest("Observação é obrigatória para batidas manuais");
  }

  const dataHoraBatida = new Date(data_hora);

  // Verificar se a data não é futura
  const agora = getDataHoraBrasilia();
  if (dataHoraBatida > agora) {
    throw ApiError.badRequest(
      "Não é possível registrar batida com data futura"
    );
  }

  // Se aprovador está adicionando para outro usuário, usar o ID do outro usuário
  const usuarioAlvoId =
    podeAprovar && para_usuario_id ? para_usuario_id : usuario_id;

  const usuarioAlvo = await Usuario.findByPk(usuarioAlvoId, {
    attributes: ["usuario_id"],
    include: [
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_batida_fora_empresa"],
      },
    ],
  });

  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  const exigeFoto =
    usuarioAlvo.funcionario?.funcionario_batida_fora_empresa === 1;

  if (exigeFoto && !req.file) {
    throw ApiError.badRequest(
      "Anexo obrigatório para batida manual fora da empresa."
    );
  }

  const fotoPath = req.file ? `/uploads/batidas/${req.file.filename}` : null;

  // Definir status baseado na permissão do usuário
  const status = podeAprovar ? "aprovada" : "pendente";

  // Criar batida
  const novaBatida = await BatidaPonto.create({
    batida_usuario_id: usuarioAlvoId,
    batida_data_hora: dataHoraBatida,
    batida_tipo: tipo,
    batida_status: status,
    batida_observacao: observacao,
    batida_aprovador_id: podeAprovar ? usuario_id : null,
    batida_data_aprovacao: podeAprovar ? new Date() : null,
    ...(fotoPath ? { batida_foto_caminho: fotoPath } : {}),
  });

  // Se a batida foi aprovada automaticamente, recalcular o dia
  if (podeAprovar) {
    const dataBatida = getDataBrasilia(dataHoraBatida);

    const inicioDia = new Date(dataBatida);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataBatida);
    fimDia.setHours(23, 59, 59, 999);

    const todasBatidas = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: usuarioAlvoId,
        batida_data_hora: {
          [Op.between]: [inicioDia, fimDia],
        },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    const perfil = await getPerfilJornadaUsuario(usuarioAlvoId);
    await calcularESalvarDia(usuarioAlvoId, dataBatida, todasBatidas, perfil);

    return res.status(201).json({
      batida: novaBatida,
      mensagem: "Batida registrada e aprovada automaticamente",
    });
  }

  return res.status(201).json({
    batida: novaBatida,
    mensagem: "Batida registrada e aguardando aprovação",
  });
}

// ==================== FUNÇÕES DE GESTÃO (APROVADORES) ====================

// Listar empresas para gestão de ponto
export async function getGestaoEmpresas(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  const empresas = await Empresa.findAll({
    order: [["empresa_nome", "ASC"]],
  });

  return res.status(200).json({
    empresas: empresas.map((e) => ({
      id: e.empresa_id,
      nome: e.empresa_nome,
    })),
  });
}

// Listar usuários funcionários (filtrado por empresa)
export async function getGestaoFuncionarios(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  const { empresa_id } = req.query;

  // Buscar usuários que tem perfil de jornada (ou seja, batem ponto)
  // Um usuário é do tipo Funcionário se tem perfil_jornada_id e funcionario_id
  const whereClause = {
    usuario_ativo: 1,
    usuario_perfil_jornada_id: { [Op.not]: null },
  };

  if (empresa_id) {
    whereClause.usuario_empresa_id = empresa_id;
  }

  const usuarios = await Usuario.findAll({
    where: whereClause,
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
        required: false,
      },
      {
        model: PerfilJornada,
        as: "perfilJornada",
        required: false,
      },
      {
        model: Funcionario,
        as: "funcionario",
        attributes: ["funcionario_id", "funcionario_ativo"],
        required: false,
      },
    ],
    order: [["usuario_nome", "ASC"]],
  });

  // Filtrar apenas usuários do tipo Funcionário que estão ativos (usuário E funcionário)
  const funcionariosAtivos = usuarios
    .filter((u) => {
      // Verificar se é usuário do tipo Funcionário
      const eUsuarioFuncionario =
        u.usuario_perfil_jornada_id !== null &&
        u.usuario_funcionario_id !== null;

      if (!eUsuarioFuncionario) {
        // Se não é funcionário, incluir normalmente (usuários administrativos com perfil de jornada)
        return true;
      }

      // Se é funcionário, verificar se usuário E funcionário estão ativos
      const usuarioAtivo = u.usuario_ativo === 1;
      const funcionarioAtivo =
        u.funcionario && u.funcionario.funcionario_ativo === 1;

      // Incluir apenas se usuário e funcionário estiverem ativos
      return usuarioAtivo && funcionarioAtivo;
    })
    .map((u) => ({
      id: u.usuario_id,
      nome: u.usuario_nome,
      empresa_id: u.usuario_empresa_id,
      empresa_nome: u.empresa?.empresa_nome,
    }));

  return res.status(200).json({
    funcionarios: funcionariosAtivos,
  });
}

// Obter histórico de um usuário específico
export async function getHistoricoFuncionario(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  const { id } = req.params;
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const usuarioAlvo = await Usuario.findByPk(id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  // Obter data de criação do usuário (para não contar dias anteriores como falta)
  const dataCriacaoUsuario = usuarioAlvo.usuario_data_criacao
    ? parseDateOnly(usuarioAlvo.usuario_data_criacao)
    : null;

  // Verificar se é o mês atual para limitar até a data atual
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);

  // Se for mês atual, limitar até hoje
  const ultimoDiaConsiderado = eMesAtual ? hoje.getDate() : fimMes.getDate();
  const dataLimite = eMesAtual ? hoje : fimMes;

  // Calcular primeiro dia válido baseado na data de criação
  let primeiroDiaValido = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDiaValido = criacaoDia;
    } else if (
      criacaoAno > parseInt(ano) ||
      (criacaoAno === parseInt(ano) && criacaoMes > parseInt(mes))
    ) {
      // Usuário foi criado após este mês - nenhum dia é válido
      primeiroDiaValido = ultimoDiaConsiderado + 1;
    }
  }

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: id,
      justificativa_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
    },
  });

  // Buscar batidas do mês (até a data limite)
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(dataLimite);
  fimDiaMes.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: id,
      batida_data_hora: {
        [Op.between]: [inicioDiaMes, fimDiaMes],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Organizar batidas por dia (mantendo nomes originais para compatibilidade com frontend)
  const batidasPorDia = {};
  batidas.forEach((b) => {
    const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
    if (!batidasPorDia[dataStr]) {
      batidasPorDia[dataStr] = [];
    }
    batidasPorDia[dataStr].push({
      batida_id: b.batida_id,
      batida_tipo: b.batida_tipo,
      batida_data_hora: b.batida_data_hora,
      batida_status: b.batida_status,
      batida_foto_caminho: b.batida_foto_caminho,
      batida_alterada: !!b.batida_alterada,
      batida_data_hora_original: b.batida_data_hora_original || null,
      batida_alterado_por_id: b.batida_alterado_por_id || null,
      batida_data_alteracao: b.batida_data_alteracao || null,
    });
  });

  // Organizar justificativas por dia
  const justificativasPorDia = {};
  justificativas.forEach((j) => {
    const dataStr = formatarDataStr(j.justificativa_data);
    if (!justificativasPorDia[dataStr]) {
      justificativasPorDia[dataStr] = [];
    }
    justificativasPorDia[dataStr].push(j);
  });

  // Buscar perfil de jornada para calcular horas previstas
  const perfil = await getPerfilJornadaUsuario(id);

  // Montar resposta - calcular horas em tempo real
  const diasDoMes = [];
  let totalHorasPrevistas = 0;
  let totalHorasTrabalhadas = 0;
  let totalHorasExtras = 0;
  let totalHorasNegativas = 0;

  for (let dia = 1; dia <= ultimoDiaConsiderado; dia++) {
    const data = new Date(parseInt(ano), parseInt(mes) - 1, dia);
    const dataStr = data.toISOString().split("T")[0];

    // Verificar se o dia é válido (após data de criação do usuário)
    const diaValido = dia >= primeiroDiaValido;

    // Pular dias antes da data de cadastro - não exibir no histórico
    if (!diaValido) {
      continue;
    }

    // Verificar se é feriado/domingo, férias ou atestado
    const nomeFeriado = await getNomeFeriado(id, data);
    const eFeriadoOuDomingo = nomeFeriado !== null;
    const feriasPeriodoDia = await getFeriasPeriodo(id, data);
    const emFerias = !!feriasPeriodoDia;
    const emAtestado = await isEmAtestado(id, data);
    const eDiaNaoUtil = eFeriadoOuDomingo || emFerias || emAtestado;

    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistasDia = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, data);

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let status = "normal";

    // Calcular horas trabalhadas em tempo real baseado nas batidas válidas
    const batidasValidas = batidasDoDia.filter(
      (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
    );
    horasTrabalhadas = calcularHorasTrabalhadas(batidasValidas);

    // Calcular extras e negativas
    if (eFeriadoOuDomingo) {
      // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
      horasExtras = horasTrabalhadas * 2;
      horasNegativas = 0;
    } else if (emFerias || emAtestado) {
      // Em férias ou atestado: não considerar horas negativas
      horasExtras = horasTrabalhadas;
      horasNegativas = 0;
    } else {
      // Em dias normais: calcular normalmente
      horasExtras = horasPrevistasDia
        ? Math.max(0, horasTrabalhadas - horasPrevistasDia)
        : 0;
      horasNegativas = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadas)
        : 0;

      // Aplicar tolerância de 10 minutos
      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
      horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

      // Verificar se é uma falta (dia que já passou, sem batidas, que deveria ter trabalhado)
      if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
        horasNegativas = horasPrevistasDia;
        status = "divergente";
      } else if (horasExtras > 0 || horasNegativas > 0) {
        status = "divergente";
      }
    }

    // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), zerar horas negativas
    const justificativasDoDia = justificativasPorDia[dataStr] || [];
    const temJustificativaAprovada = justificativasDoDia.some(
      (j) =>
        j.justificativa_status === "aprovada" &&
        !["falta_nao_justificada", "horas_extras"].includes(
          j.justificativa_tipo
        )
    );
    if (temJustificativaAprovada) {
      horasNegativas = 0;
    }

    // Verificar se é o dia atual e se deve incluir nos totais
    const hojeStr = hoje.toISOString().split("T")[0];
    const eDiaAtual = dataStr === hojeStr;

    // Se for o dia atual, só incluir nos totais se houver pelo menos 2 saídas
    let deveIncluirNosTotais = true;
    if (eDiaAtual) {
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) =>
          b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );
      const saidasDoDia = batidasValidasDoDia.filter(
        (b) => b.batida_tipo === "saida"
      );
      deveIncluirNosTotais = saidasDoDia.length >= 2;
    }

    // Somar aos totais apenas para dias válidos e que atendam os critérios
    if (deveIncluirNosTotais) {
      totalHorasPrevistas += horasPrevistasDia || 0;
      totalHorasTrabalhadas += horasTrabalhadas;
      totalHorasExtras += horasExtras;
      totalHorasNegativas += horasNegativas;
    }

    const saldoDia = horasExtras - horasNegativas;

    diasDoMes.push({
      data: dataStr,
      horasTrabalhadas,
      horasExtras,
      horasNegativas,
      saldoDia,
      horasPrevistas: horasPrevistasDia || 0,
      status,
      batidas: batidasDoDia,
      justificativas: justificativasPorDia[dataStr] || [],
      diaValido: true, // Todos os dias aqui são válidos (já filtrados acima)
      feriado: nomeFeriado || null,
      emFerias: emFerias,
      ferias: feriasPeriodoDia,
    });
  }

  // Calcular horas pendentes (previstas - trabalhadas, se positivo)
  const horasPendentes = Math.max(
    0,
    totalHorasPrevistas - totalHorasTrabalhadas
  );

  // Calcular banco de horas ACUMULADO (desde a data de início até o mês consultado)
  const bancoHorasRecord = await BancoHoras.findOne({
    where: { banco_usuario_id: id },
  });

  // Definir data de início do cálculo do banco (última zeragem ou criação do usuário)
  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHorasRecord?.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHorasRecord.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  // Calcular o banco de horas acumulado de todos os meses desde dataInicioBanco até o mês consultado
  let bancoHorasAcumulado = 0;

  // Iterar por todos os meses desde dataInicioBanco até o mês consultado
  let mesCursor = new Date(
    dataInicioBanco.getFullYear(),
    dataInicioBanco.getMonth(),
    1
  );
  const fimConsulta = new Date(parseInt(ano), parseInt(mes) - 1, 1);

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    // Definir período do mês
    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);

    // Verificar se é o mês atual (para limitar até hoje)
    const eMesAtualCursor =
      mesCursorNum === mesAtual && anoCursorNum === anoAtual;
    const dataLimiteCursor = eMesAtualCursor ? hoje : fimMesCursor;
    const ultimoDiaCursor = eMesAtualCursor
      ? hoje.getDate()
      : fimMesCursor.getDate();

    // Calcular primeiro dia válido deste mês
    let primeiroDiaCursor = 1;
    if (
      dataInicioBanco.getFullYear() === anoCursorNum &&
      dataInicioBanco.getMonth() + 1 === mesCursorNum
    ) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    // Buscar batidas do mês
    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: id,
        batida_data_hora: {
          [Op.between]: [
            inicioMesCursor,
            new Date(
              dataLimiteCursor.getFullYear(),
              dataLimiteCursor.getMonth(),
              dataLimiteCursor.getDate(),
              23,
              59,
              59,
              999
            ),
          ],
        },
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    // Organizar batidas por dia
    const batidasPorDiaMes = {};
    batidasMes.forEach((b) => {
      const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
      if (!batidasPorDiaMes[dataStr]) batidasPorDiaMes[dataStr] = [];
      batidasPorDiaMes[dataStr].push(b);
    });

    // Buscar justificativas aprovadas do mês (exceto falta_nao_justificada e horas_extras)
    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: {
          [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
        },
      },
    });
    const diasJustificados = new Set(
      justificativasMes.map((j) => {
        const data = j.justificativa_data;
        // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
        return typeof data === "string"
          ? data
          : new Date(data).toISOString().split("T")[0];
      })
    );

    // Calcular horas do mês
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const data = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = data.toISOString().split("T")[0];

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      
      // Filtrar apenas batidas válidas (não recusadas e não pendentes)
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );
      
      // Verificar se é feriado/domingo, férias ou atestado
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(id, data);
      const eEmFerias = await isEmFerias(id, data);
      const eEmAtestado = await isEmAtestado(id, data);
      const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;
      const horasPrevistasDia = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, data);

      // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), não conta horas negativas
      if (diasJustificados.has(dataStr)) {
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasValidasDoDia);

      let horasExtrasDia = 0;
      let horasNegativasDia = 0;

      if (eFeriadoOuDomingo) {
        // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
        horasExtrasDia = horasTrabalhadasDia * 2;
        horasNegativasDia = 0;
      } else if (eEmFerias || eEmAtestado) {
        // Em férias ou atestado: não considerar horas negativas
        horasExtrasDia = horasTrabalhadasDia;
        horasNegativasDia = 0;
      } else {
        // Em dias normais: calcular normalmente
        if (horasPrevistasDia === null || horasPrevistasDia === 0) {
          // Se não há horas previstas, todas as horas trabalhadas são extras
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistasDia);
          horasNegativasDia = Math.max(0, horasPrevistasDia - horasTrabalhadasDia);

          // Aplicar tolerância
          const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
          horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia =
            horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          // Se é falta (sem batida em dia que deveria trabalhar)
          if (data < hoje && horasPrevistasDia > 0 && batidasValidasDoDia.length === 0) {
            horasNegativasDia = horasPrevistasDia;
          }
        }
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
        );
        const saidasDoDia = batidasValidasDoDia.filter(
          (b) => b.batida_tipo === "saida"
        );
        deveIncluirNoBanco = saidasDoDia.length >= 2;
      }

      // Somar ao banco de horas apenas se atender os critérios
      if (deveIncluirNoBanco) {
        bancoHorasAcumulado += horasExtrasDia - horasNegativasDia;
      }
    }

    // Avançar para o próximo mês
    mesCursor = new Date(mesCursor.getFullYear(), mesCursor.getMonth() + 1, 1);
  }

  return res.status(200).json({
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
      dataCriacao: dataCriacaoUsuario
        ? formatarDataStr(dataCriacaoUsuario)
        : null,
    },
    dias: diasDoMes,
    bancoHoras: bancoHorasAcumulado,
    resumoMes: {
      horasPrevistas: totalHorasPrevistas,
      horasTrabalhadas: totalHorasTrabalhadas,
      horasExtras: totalHorasExtras,
      horasNegativas: totalHorasNegativas,
      horasPendentes: horasPendentes,
      eMesAtual: eMesAtual,
      dataLimite: eMesAtual ? hoje.toISOString().split("T")[0] : null,
      primeiroDiaValido: primeiroDiaValido,
    },
  });
}

// Listar pendências (justificativas e batidas pendentes)
export async function getPendentes(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  // Buscar justificativas pendentes
  const justificativasPendentes = await Justificativa.findAll({
    where: { justificativa_status: "pendente" },
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: [
          "usuario_id",
          "usuario_nome",
          "usuario_ativo",
          "usuario_funcionario_id",
          "usuario_perfil_jornada_id",
        ],
        include: [
          {
            model: Funcionario,
            as: "funcionario",
            attributes: ["funcionario_id", "funcionario_ativo"],
            required: false,
          },
        ],
      },
    ],
    order: [["justificativa_data", "DESC"]],
  });

  // Buscar batidas pendentes
  const batidasPendentes = await BatidaPonto.findAll({
    where: { batida_status: "pendente" },
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: [
          "usuario_id",
          "usuario_nome",
          "usuario_ativo",
          "usuario_funcionario_id",
          "usuario_perfil_jornada_id",
        ],
        include: [
          {
            model: Funcionario,
            as: "funcionario",
            attributes: ["funcionario_id", "funcionario_ativo"],
            required: false,
          },
        ],
      },
    ],
    order: [["batida_data_hora", "DESC"]],
  });

  // Filtrar apenas usuários do tipo Funcionário que estão ativos
  // Um usuário é do tipo Funcionário se tem perfil_jornada_id e funcionario_id
  // Está inativo se: usuario_ativo = 0 OU funcionario_ativo = 0
  const justificativasFiltradas = justificativasPendentes.filter((j) => {
    const usuario = j.usuario;
    if (!usuario) return false;

    // Verificar se é usuário do tipo Funcionário
    const eUsuarioFuncionario =
      usuario.usuario_perfil_jornada_id !== null &&
      usuario.usuario_funcionario_id !== null;

    if (!eUsuarioFuncionario) {
      // Se não é funcionário, incluir normalmente
      return true;
    }

    // Se é funcionário, verificar se está ativo
    const usuarioAtivo = usuario.usuario_ativo === 1;
    const funcionarioAtivo =
      usuario.funcionario && usuario.funcionario.funcionario_ativo === 1;

    // Incluir apenas se usuário e funcionário estiverem ativos
    return usuarioAtivo && funcionarioAtivo;
  });

  const batidasFiltradas = batidasPendentes.filter((b) => {
    const usuario = b.usuario;
    if (!usuario) return false;

    // Verificar se é usuário do tipo Funcionário
    const eUsuarioFuncionario =
      usuario.usuario_perfil_jornada_id !== null &&
      usuario.usuario_funcionario_id !== null;

    if (!eUsuarioFuncionario) {
      // Se não é funcionário, incluir normalmente
      return true;
    }

    // Se é funcionário, verificar se está ativo
    const usuarioAtivo = usuario.usuario_ativo === 1;
    const funcionarioAtivo =
      usuario.funcionario && usuario.funcionario.funcionario_ativo === 1;

    // Incluir apenas se usuário e funcionário estiverem ativos
    return usuarioAtivo && funcionarioAtivo;
  });

  // Mapear para formato compatível com frontend (incluir path normalizado do anexo para download)
  const justificativasMapeadas = justificativasFiltradas.map((j) => {
    const json = j.toJSON();
    let anexoDownloadPath = json.justificativa_anexo_caminho;
    if (anexoDownloadPath) {
      const raw = anexoDownloadPath;
      const rel =
        path.isAbsolute(raw) || raw.includes(":\\")
          ? path.relative(process.cwd(), raw)
          : raw;
      anexoDownloadPath = rel.replace(/\\/g, "/").replace(/^\.\/?/, "");
    }
    return {
      ...json,
      justificativa_anexo_download_path: anexoDownloadPath || null,
      funcionario: j.usuario
        ? {
            funcionario_id: j.usuario.usuario_id,
            funcionario_nome: j.usuario.usuario_nome,
          }
        : null,
    };
  });

  const batidasMapeadas = batidasFiltradas.map((b) => ({
    ...b.toJSON(),
    funcionario: b.usuario
      ? {
          funcionario_id: b.usuario.usuario_id,
          funcionario_nome: b.usuario.usuario_nome,
        }
      : null,
  }));

  return res.status(200).json({
    justificativas: justificativasMapeadas,
    batidas: batidasMapeadas,
  });
}

// Aprovar batida pendente
export async function aprovarBatida(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;

  const batida = await BatidaPonto.findByPk(id);

  if (!batida) {
    throw ApiError.notFound("Batida não encontrada");
  }

  if (batida.batida_status !== "pendente") {
    throw ApiError.badRequest("Apenas batidas pendentes podem ser aprovadas");
  }

  batida.batida_status = "aprovada";
  batida.batida_aprovador_id = usuario_id;
  batida.batida_data_aprovacao = new Date();
  await batida.save();

  // Recalcular dia
  const dataBatida = new Date(batida.batida_data_hora);
  const dataStr = dataBatida.toISOString().split("T")[0];
  const data = new Date(dataStr);

  const inicioDia = new Date(data);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(data);
  fimDia.setHours(23, 59, 59, 999);

  const batidaUsuarioId = batida.batida_usuario_id;

  const todasBatidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: batidaUsuarioId,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const perfil = await getPerfilJornadaUsuario(batidaUsuarioId);
  await calcularESalvarDia(batidaUsuarioId, data, todasBatidas, perfil);

  return res.status(200).json({
    batida,
    mensagem: "Batida aprovada com sucesso",
  });
}

// Reprovar batida pendente
export async function reprovarBatida(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;
  const { motivo } = req.body;

  const batida = await BatidaPonto.findByPk(id);

  if (!batida) {
    throw ApiError.notFound("Batida não encontrada");
  }

  if (batida.batida_status !== "pendente") {
    throw ApiError.badRequest("Apenas batidas pendentes podem ser reprovadas");
  }

  batida.batida_status = "recusada";
  batida.batida_aprovador_id = usuario_id;
  batida.batida_data_aprovacao = new Date();
  if (motivo) {
    batida.batida_observacao =
      (batida.batida_observacao || "") + ` | Motivo recusa: ${motivo}`;
  }
  await batida.save();

  const dataBatida = new Date(batida.batida_data_hora);
  const dataStr = dataBatida.toISOString().split("T")[0];
  await verificarECriarFalta(batida.batida_usuario_id, dataStr);

  return res.status(200).json({
    batida,
    mensagem: "Batida reprovada",
  });
}

// Invalidar batida (marca como recusada)
export async function invalidarBatida(req, res) {
  requirePermissao(req, "invalidar_batida_ponto");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;
  const { motivo } = req.body;

  const batida = await BatidaPonto.findByPk(id);

  if (!batida) {
    throw ApiError.notFound("Batida nao encontrada");
  }

  if (batida.batida_status === "recusada") {
    throw ApiError.badRequest("Batida ja esta recusada");
  }

  batida.batida_status = "recusada";
  batida.batida_aprovador_id = usuario_id;
  batida.batida_data_aprovacao = new Date();
  if (motivo) {
    batida.batida_observacao =
      (batida.batida_observacao || "") + ` | Motivo invalidacao: ${motivo}`;
  }
  await batida.save();

  // Recalcular dia removendo a batida invalida
  const dataBatida = new Date(batida.batida_data_hora);
  const dataStr = dataBatida.toISOString().split("T")[0];
  const data = new Date(dataStr);

  const inicioDia = new Date(data);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(data);
  fimDia.setHours(23, 59, 59, 999);

  const batidaUsuarioId = batida.batida_usuario_id;

  const batidasValidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: batidaUsuarioId,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
      batida_status: {
        [Op.in]: ["normal", "aprovada"],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const perfil = await getPerfilJornadaUsuario(batidaUsuarioId);
  await calcularESalvarDia(batidaUsuarioId, data, batidasValidas, perfil);

  await verificarECriarFalta(batidaUsuarioId, dataStr);

  return res.status(200).json({
    batida,
    mensagem: "Batida invalidada",
  });
}

// Fechar/Zerar banco de horas de um usuário
export async function fecharBancoHoras(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { funcionario_id } = req.params;

  const usuarioAlvo = await Usuario.findByPk(funcionario_id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  const bancoHoras = await BancoHoras.findOne({
    where: { banco_usuario_id: funcionario_id },
  });

  if (!bancoHoras) {
    throw ApiError.badRequest("Usuário não possui banco de horas");
  }

  const saldoAnterior = bancoHoras.banco_saldo;

  // Calcular o dia 1 do mês atual no fuso de Brasília
  const hoje = getDataBrasilia();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const primeiroDiaMesStr = primeiroDiaMes.toISOString().split("T")[0];

  // Zerar o banco de horas e definir data de início como dia 1 do mês atual
  bancoHoras.banco_saldo = 0;
  bancoHoras.banco_ultima_atualizacao = new Date();
  bancoHoras.banco_data_inicio = primeiroDiaMesStr;
  await bancoHoras.save();

  return res.status(200).json({
    mensagem:
      "Banco de horas fechado com sucesso. Contagem reiniciada a partir do dia 1 do mês atual.",
    saldoAnterior: saldoAnterior / 60,
    dataInicio: primeiroDiaMesStr,
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
    },
  });
}

// Recalcular banco de horas desde a data de início (ou desde sempre se não houver data de início)
export async function recalcularBancoHoras(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { funcionario_id } = req.params;

  const usuarioAlvo = await Usuario.findByPk(funcionario_id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  // Obter data de criação do usuário
  const dataCriacaoUsuario = usuarioAlvo.usuario_data_criacao
    ? parseDateOnly(usuarioAlvo.usuario_data_criacao)
    : null;

  // Buscar banco de horas para obter data de início
  const [bancoHoras] = await BancoHoras.findOrCreate({
    where: { banco_usuario_id: funcionario_id },
    defaults: { banco_saldo: 0 },
  });

  // Definir data de início do cálculo (última zeragem ou criação do usuário)
  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHoras.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHoras.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(funcionario_id);

  // Calcular banco de horas em tempo real desde dataInicioBanco até hoje
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  let saldoTotalHoras = 0;
  let diasProcessados = 0;

  // Iterar por todos os meses desde dataInicioBanco até o mês atual
  let mesCursor = new Date(
    dataInicioBanco.getFullYear(),
    dataInicioBanco.getMonth(),
    1
  );
  const fimConsulta = new Date(anoAtual, mesAtual - 1, 1);

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    // Definir período do mês
    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);

    // Verificar se é o mês atual (para limitar até hoje)
    const eMesAtualCursor =
      mesCursorNum === mesAtual && anoCursorNum === anoAtual;
    const dataLimiteCursor = eMesAtualCursor ? hoje : fimMesCursor;
    const ultimoDiaCursor = eMesAtualCursor
      ? hoje.getDate()
      : fimMesCursor.getDate();

    // Calcular primeiro dia válido deste mês
    let primeiroDiaCursor = 1;
    if (
      dataInicioBanco.getFullYear() === anoCursorNum &&
      dataInicioBanco.getMonth() + 1 === mesCursorNum
    ) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    // Buscar batidas do mês
    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: funcionario_id,
        batida_data_hora: {
          [Op.between]: [
            inicioMesCursor,
            new Date(
              dataLimiteCursor.getFullYear(),
              dataLimiteCursor.getMonth(),
              dataLimiteCursor.getDate(),
              23,
              59,
              59,
              999
            ),
          ],
        },
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    // Organizar batidas por dia
    const batidasPorDiaMes = {};
    batidasMes.forEach((b) => {
      const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
      if (!batidasPorDiaMes[dataStr]) batidasPorDiaMes[dataStr] = [];
      batidasPorDiaMes[dataStr].push(b);
    });

    // Buscar justificativas aprovadas do mês (exceto falta_nao_justificada e horas_extras)
    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: funcionario_id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: {
          [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
        },
      },
    });
    const diasJustificados = new Set(
      justificativasMes.map((j) => {
        const data = j.justificativa_data;
        // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
        return typeof data === "string"
          ? data
          : new Date(data).toISOString().split("T")[0];
      })
    );

    // Calcular horas do mês
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const dataDia = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = dataDia.toISOString().split("T")[0];

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      
      // Verificar se é feriado/domingo, férias ou atestado
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(funcionario_id, dataDia);
      const eEmFerias = await isEmFerias(funcionario_id, dataDia);
      const eEmAtestado = await isEmAtestado(funcionario_id, dataDia);
      const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;
      const horasPrevistasDia = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, dataDia);

      // Se o dia foi justificado como falta, não conta como negativo
      if (diasJustificados.has(dataStr)) {
        diasProcessados++;
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = 0;
      let horasNegativasDia = 0;

      if (eFeriadoOuDomingo) {
        // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
        horasExtrasDia = horasTrabalhadasDia * 2;
        horasNegativasDia = 0;
      } else if (eEmFerias || eEmAtestado) {
        // Em férias: não considerar horas negativas
        horasExtrasDia = horasTrabalhadasDia;
        horasNegativasDia = 0;
      } else {
        // Em dias normais: calcular normalmente
        if (horasPrevistasDia === null || horasPrevistasDia === 0) {
          // Se não há horas previstas, todas as horas trabalhadas são extras
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistasDia);
          horasNegativasDia = Math.max(0, horasPrevistasDia - horasTrabalhadasDia);

          // Aplicar tolerância
          const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
          horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia =
            horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          // Verificar falta (dia sem batida que deveria ter trabalhado)
          if (
            dataDia < hoje &&
            horasPrevistasDia > 0 &&
            batidasDoDia.length === 0
          ) {
            horasNegativasDia = horasPrevistasDia;
          }
        }
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
        );
        const saidasDoDia = batidasValidasDoDia.filter(
          (b) => b.batida_tipo === "saida"
        );
        deveIncluirNoBanco = saidasDoDia.length >= 2;
      }

      // Somar ao banco de horas apenas se atender os critérios
      if (deveIncluirNoBanco) {
        saldoTotalHoras += horasExtrasDia - horasNegativasDia;
      }
      diasProcessados++;
    }

    // Avançar para o próximo mês
    mesCursor = new Date(mesCursor.getFullYear(), mesCursor.getMonth() + 1, 1);
  }

  const saldoAnterior = bancoHoras.banco_saldo;
  bancoHoras.banco_saldo = Math.round(saldoTotalHoras * 60); // Converter para minutos
  bancoHoras.banco_ultima_atualizacao = new Date();
  await bancoHoras.save();

  return res.status(200).json({
    mensagem: "Banco de horas recalculado com sucesso",
    saldoAnterior: saldoAnterior / 60,
    saldoNovo: saldoTotalHoras,
    diasProcessados: diasProcessados,
    dataInicio: bancoHoras.banco_data_inicio || null,
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
    },
  });
}

// Aprovar todas as batidas pendentes de um dia e recalcular
export async function aprovarBatidasDia(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const usuario_id = getUsuarioId(req);
  const { funcionario_id } = req.params;
  const { data } = req.body;

  if (!data) {
    throw ApiError.badRequest("Data é obrigatória");
  }

  const usuarioAlvo = await Usuario.findByPk(funcionario_id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  const dataAlvo = new Date(data);
  const inicioDia = new Date(dataAlvo);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAlvo);
  fimDia.setHours(23, 59, 59, 999);

  // Aprovar todas as batidas pendentes do dia
  const batidasPendentes = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
      batida_status: "pendente",
    },
  });

  for (const batida of batidasPendentes) {
    batida.batida_status = "aprovada";
    batida.batida_aprovador_id = usuario_id;
    batida.batida_data_aprovacao = new Date();
    await batida.save();
  }

  // Buscar todas as batidas do dia
  const todasBatidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Recalcular o dia
  const perfil = await getPerfilJornadaUsuario(funcionario_id);
  await calcularESalvarDia(funcionario_id, dataAlvo, todasBatidas, perfil);

  return res.status(200).json({
    mensagem: `${batidasPendentes.length} batida(s) aprovada(s) e dia recalculado`,
    batidasAprovadas: batidasPendentes.length,
  });
}

// Recalcular um dia específico
export async function recalcularDia(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { funcionario_id } = req.params;
  const { data } = req.body;

  if (!data) {
    throw ApiError.badRequest("Data é obrigatória");
  }

  const usuarioAlvo = await Usuario.findByPk(funcionario_id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  const dataAlvo = new Date(data);
  const inicioDia = new Date(dataAlvo);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataAlvo);
  fimDia.setHours(23, 59, 59, 999);

  // Buscar todas as batidas do dia
  const todasBatidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: funcionario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Recalcular o dia
  const perfil = await getPerfilJornadaUsuario(funcionario_id);
  const diaRecalculado = await calcularESalvarDia(
    funcionario_id,
    dataAlvo,
    todasBatidas,
    perfil
  );

  return res.status(200).json({
    mensagem: "Dia recalculado com sucesso",
    dia: {
      data: data,
      horasTrabalhadas: parseFloat(diaRecalculado?.dia_horas_trabalhadas || 0),
      horasExtras: parseFloat(diaRecalculado?.dia_horas_extras || 0),
      horasNegativas: parseFloat(diaRecalculado?.dia_horas_negativas || 0),
      status: diaRecalculado?.dia_status || "normal",
    },
  });
}

// Alterar horário de uma batida (apenas admin com ponto.alterar_batidas)
export async function alterarHorarioBatida(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const usuario_id = getUsuarioId(req);
  const { id: batida_id } = req.params;
  const { data_hora, tipo } = req.body;

  if (!data_hora) {
    throw ApiError.badRequest("data_hora é obrigatória");
  }

  // O tipo (entrada/saída) não pode ser alterado; apenas o horário
  if (tipo !== undefined) {
    throw ApiError.badRequest(
      "Não é permitido alterar o tipo da batida (entrada/saída); apenas o horário pode ser alterado"
    );
  }

  const batida = await BatidaPonto.findByPk(batida_id);
  if (!batida) {
    throw ApiError.notFound("Batida não encontrada");
  }

  if (!["normal", "aprovada"].includes(batida.batida_status)) {
    throw ApiError.badRequest(
      "Só é possível alterar horário de batidas com status normal ou aprovada"
    );
  }

  const novaDataHoraReq = new Date(data_hora);
  if (Number.isNaN(novaDataHoraReq.getTime())) {
    throw ApiError.badRequest("data_hora inválida");
  }

  // Manter a DATA da batida e alterar apenas a HORA (não é permitido alterar o dia)
  const dataDaBatida = getDataBrasilia(batida.batida_data_hora);
  const novaDataHora = new Date(
    dataDaBatida.getFullYear(),
    dataDaBatida.getMonth(),
    dataDaBatida.getDate(),
    novaDataHoraReq.getHours(),
    novaDataHoraReq.getMinutes(),
    novaDataHoraReq.getSeconds(),
    novaDataHoraReq.getMilliseconds()
  );

  // Na primeira alteração, guardar horário original
  if (!batida.batida_alterada) {
    batida.batida_data_hora_original = batida.batida_data_hora;
  }

  batida.batida_data_hora = novaDataHora;
  batida.batida_alterada = 1;
  batida.batida_alterado_por_id = usuario_id;
  batida.batida_data_alteracao = new Date();
  // batida_tipo (entrada/saída) nunca é alterado; permanece o original
  await batida.save();

  const dataBatida = getDataBrasilia(novaDataHora);
  const inicioDia = new Date(dataBatida);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataBatida);
  fimDia.setHours(23, 59, 59, 999);

  const todasBatidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: batida.batida_usuario_id,
      batida_data_hora: {
        [Op.between]: [inicioDia, fimDia],
      },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const perfil = await getPerfilJornadaUsuario(batida.batida_usuario_id);
  await calcularESalvarDia(
    batida.batida_usuario_id,
    dataBatida,
    todasBatidas,
    perfil
  );

  return res.status(200).json({
    mensagem: "Horário da batida alterado com sucesso",
    batida: batida,
  });
}

// Exportar batidas de ponto para Excel
export async function exportarPontoExcel(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { funcionario_id } = req.params;
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const usuarioAlvo = await Usuario.findByPk(funcionario_id, {
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
      {
        model: Funcionario,
        as: "funcionario",
        required: false,
      },
    ],
  });

  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  const nomeEmpresa =
    usuarioAlvo.empresa?.empresa_nome || "Empresa não vinculada";
  
  // Obter nome completo do funcionário e sanitizar para nome de arquivo
  const nomeCompleto = usuarioAlvo.usuario_nome || "Funcionario";
  
  // Função para normalizar acentos (remover acentos mas manter letras)
  const normalizarAcentos = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // Remove diacríticos (acentos)
      .replace(/[^a-zA-Z0-9\s_-]/g, "")  // Remove caracteres especiais, mantém letras, números, espaços, underscore e hífen
      .trim();
  };
  
  // Normalizar o nome: substituir espaços múltiplos por um único espaço, trim
  let nomeFuncionario = nomeCompleto.trim().replace(/\s+/g, " ");
  
  // Normalizar acentos e substituir espaços por underscores
  nomeFuncionario = normalizarAcentos(nomeFuncionario)
    .replace(/\s+/g, "_")  // Espaços viram underscore
    .toLowerCase();
  
  // Se após a normalização ficar vazio, usar padrão
  if (!nomeFuncionario || nomeFuncionario.length === 0) {
    nomeFuncionario = "funcionario";
  }

  // Obter data de criação do usuário
  const dataCriacaoUsuario = usuarioAlvo.usuario_data_criacao
    ? parseDateOnly(usuarioAlvo.usuario_data_criacao)
    : null;

  // Verificar se o funcionário está desligado ou usuário inativo
  const funcionario = usuarioAlvo.funcionario;
  const funcionarioInativo = funcionario && funcionario.funcionario_ativo === 0;
  const usuarioInativo = usuarioAlvo.usuario_ativo === 0;
  
  // Obter data de desligamento se aplicável
  let dataDesligamento = null;
  if (funcionarioInativo) {
    dataDesligamento = funcionario.funcionario_data_desligamento
      ? parseDateOnly(funcionario.funcionario_data_desligamento)
      : null;
    
    if (!dataDesligamento) {
      // Se não tem data de desligamento mas o funcionário está inativo, buscar última batida
      const ultimaBatida = await BatidaPonto.findOne({
        where: {
          batida_usuario_id: funcionario_id,
          batida_status: { [Op.in]: ["normal", "aprovada"] },
        },
        order: [["batida_data_hora", "DESC"]],
      });
      
      if (ultimaBatida) {
        dataDesligamento = getDataBrasilia(new Date(ultimaBatida.batida_data_hora));
      } else {
        dataDesligamento = dataCriacaoUsuario || getDataBrasilia();
      }
    }
  } else if (usuarioInativo) {
    // Se apenas o usuário está inativo, buscar a última batida de ponto
    const ultimaBatida = await BatidaPonto.findOne({
      where: {
        batida_usuario_id: funcionario_id,
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "DESC"]],
    });
    
    if (ultimaBatida) {
      dataDesligamento = getDataBrasilia(new Date(ultimaBatida.batida_data_hora));
    } else {
      dataDesligamento = dataCriacaoUsuario || getDataBrasilia();
    }
  }

  // Verificar se é o mês atual para limitar até a data atual
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);

  // Limitar até a data de desligamento ou fim do mês, o que for menor
  let dataLimite = eMesAtual ? hoje : fimMes;
  if (dataDesligamento) {
    const dataDesligamentoOnly = getDataBrasilia(dataDesligamento);
    dataLimite = eMesAtual
      ? dataDesligamentoOnly < hoje
        ? dataDesligamentoOnly
        : hoje
      : dataDesligamentoOnly < fimMes
      ? dataDesligamentoOnly
      : fimMes;
  }

  const ultimoDiaConsiderado = dataLimite.getDate();

  // Calcular primeiro dia válido baseado na data de criação
  let primeiroDiaValido = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDiaValido = criacaoDia;
    } else if (
      criacaoAno > parseInt(ano) ||
      (criacaoAno === parseInt(ano) && criacaoMes > parseInt(mes))
    ) {
      primeiroDiaValido = ultimoDiaConsiderado + 1;
    }
  }

  // Limitar até a data de desligamento se aplicável
  if (dataDesligamento) {
    const diaDesligamento = dataDesligamento.getDate();
    const mesDesligamentoNum = dataDesligamento.getMonth() + 1;
    const anoDesligamento = dataDesligamento.getFullYear();

    if (
      anoDesligamento === parseInt(ano) &&
      mesDesligamentoNum === parseInt(mes)
    ) {
      const ultimoDiaAjustado = Math.min(ultimoDiaConsiderado, diaDesligamento);
      // Ajustar dataLimite se necessário
      if (ultimoDiaAjustado < ultimoDiaConsiderado) {
        dataLimite = new Date(parseInt(ano), parseInt(mes) - 1, ultimoDiaAjustado);
      }
    }
  }

  // Buscar todas as batidas do mês
  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: funcionario_id,
      batida_data_hora: {
        [Op.between]: [
          inicioMes,
          new Date(
            dataLimite.getFullYear(),
            dataLimite.getMonth(),
            dataLimite.getDate(),
            23,
            59,
            59,
            999
          ),
        ],
      },
      batida_status: { [Op.in]: ["normal", "aprovada"] },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  // Buscar justificativas aprovadas (exceto falta_nao_justificada e horas_extras)
  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: funcionario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
      justificativa_status: "aprovada",
      justificativa_tipo: { [Op.in]: ["falta_justificada", "consulta_medica"] },
    },
  });
  const diasJustificados = new Set(
    justificativas.map((j) => {
      const data = j.justificativa_data;
      // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
      return typeof data === "string"
        ? data
        : new Date(data).toISOString().split("T")[0];
    })
  );

  // Organizar batidas por dia
  const batidasPorDia = {};
  batidas.forEach((b) => {
    const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
    if (!batidasPorDia[dataStr]) batidasPorDia[dataStr] = [];
    batidasPorDia[dataStr].push(b);
  });

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(funcionario_id);

  // Calcular o máximo de batidas em um dia para definir colunas
  let maxBatidas = 0;
  Object.values(batidasPorDia).forEach((batidasDia) => {
    if (batidasDia.length > maxBatidas) maxBatidas = batidasDia.length;
  });
  // Garantir pelo menos 4 colunas (2 turnos)
  maxBatidas = Math.max(maxBatidas, 4);
  // Arredondar para número par
  if (maxBatidas % 2 !== 0) maxBatidas++;

  // Dias da semana em português
  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  // Meses em português
  const mesesPt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Importar ExcelJS dinamicamente
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `Ponto ${mesesPt[parseInt(mes) - 1]} ${ano}`
  );

  // Definir número de colunas: Data + Dia Semana + batidas + Saldo
  const numColunas = 2 + maxBatidas + 1;

  // Linha 1: Nome da empresa (mesclado)
  worksheet.mergeCells(1, 1, 1, numColunas);
  const celulaEmpresa = worksheet.getCell(1, 1);
  celulaEmpresa.value = nomeEmpresa;
  celulaEmpresa.font = { bold: true, size: 16 };
  celulaEmpresa.alignment = { horizontal: "center", vertical: "middle" };
  celulaEmpresa.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" },
  };
  celulaEmpresa.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).height = 30;

  // Linha 2: Nome do funcionário (mesclado)
  worksheet.mergeCells(2, 1, 2, numColunas);
  const celulaFuncionario = worksheet.getCell(2, 1);
  celulaFuncionario.value = nomeFuncionario;
  celulaFuncionario.font = { bold: true, size: 14 };
  celulaFuncionario.alignment = { horizontal: "center", vertical: "middle" };
  celulaFuncionario.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2E5A8F" },
  };
  celulaFuncionario.font = {
    bold: true,
    size: 14,
    color: { argb: "FFFFFFFF" },
  };
  worksheet.getRow(2).height = 25;

  // Linha 3: Cabeçalhos
  const cabecalhos = ["Data", "Dia da Semana"];
  for (let i = 0; i < maxBatidas; i++) {
    cabecalhos.push(
      i % 2 === 0
        ? `Entrada ${Math.floor(i / 2) + 1}`
        : `Saída ${Math.floor(i / 2) + 1}`
    );
  }
  cabecalhos.push("Saldo");

  const linhaCabecalho = worksheet.getRow(3);
  cabecalhos.forEach((cab, index) => {
    const celula = linhaCabecalho.getCell(index + 1);
    celula.value = cab;
    celula.font = { bold: true, size: 11 };
    celula.alignment = { horizontal: "center", vertical: "middle" };
    celula.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    celula.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  worksheet.getRow(3).height = 22;

  // Definir largura das colunas
  worksheet.getColumn(1).width = 12; // Data
  worksheet.getColumn(2).width = 18; // Dia da semana
  for (let i = 3; i <= 2 + maxBatidas; i++) {
    worksheet.getColumn(i).width = 10; // Entradas/Saídas
  }
  worksheet.getColumn(numColunas).width = 12; // Saldo

  // Processar dias e adicionar linhas
  let linhaAtual = 4;
  let saldoMes = 0;

  // Buscar banco de horas para cálculo acumulado
  const bancoHorasRecord = await BancoHoras.findOne({
    where: { banco_usuario_id: funcionario_id },
  });

  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHorasRecord?.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHorasRecord.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  for (let dia = 1; dia <= ultimoDiaConsiderado; dia++) {
    const data = new Date(parseInt(ano), parseInt(mes) - 1, dia);
    const dataStr = data.toISOString().split("T")[0];
    const diaValido = dia >= primeiroDiaValido;

    // Formatar data dd/mm/yyyy
    const dataFormatada = `${String(dia).padStart(2, "0")}/${String(
      parseInt(mes)
    ).padStart(2, "0")}/${ano}`;
    const diaSemana = diasSemana[data.getDay()];

    const batidasDoDia = batidasPorDia[dataStr] || [];
    
    // Verificar se é feriado/domingo, férias ou atestado (funcionario_id é usuario_id nesta rota)
    const eFeriadoOuDomingo = await isFeriadoOuDomingo(funcionario_id, data);
    const eEmFerias = await isEmFerias(funcionario_id, data);
    const eEmAtestado = await isEmAtestado(funcionario_id, data);
    const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;
    const horasPrevistasDia = eDiaNaoUtil ? null : getHorasPrevistasDia(perfil, data);

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let saldoDia = 0;

    if (diaValido && !diasJustificados.has(dataStr) && !eEmFerias && !eEmAtestado) {
      horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

      if (eFeriadoOuDomingo) {
        // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
        horasExtras = horasTrabalhadas * 2;
        horasNegativas = 0;
      } else if (horasPrevistasDia === null || horasPrevistasDia === 0) {
        // Se não há horas previstas, todas as horas trabalhadas são extras
        horasExtras = horasTrabalhadas;
        horasNegativas = 0;
      } else {
        horasExtras = Math.max(0, horasTrabalhadas - horasPrevistasDia);
        horasNegativas = Math.max(0, horasPrevistasDia - horasTrabalhadas);

        const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
        horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
        horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

        // Falta sem batida
        if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
          horasNegativas = horasPrevistasDia;
        }
      }

      saldoDia = horasExtras - horasNegativas;
      saldoMes += saldoDia;
    }

    // Adicionar linha
    const linha = worksheet.getRow(linhaAtual);
    linha.getCell(1).value = dataFormatada;
    linha.getCell(2).value = diaSemana;

    // Adicionar batidas nas colunas corretas
    for (let i = 0; i < maxBatidas; i++) {
      const celula = linha.getCell(3 + i);
      if (batidasDoDia[i]) {
        const horaBatida = new Date(batidasDoDia[i].batida_data_hora);
        celula.value = horaBatida.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        if (batidasDoDia[i].batida_alterada) {
          celula.value += " (alterada)";
        }
      } else {
        celula.value = "-";
      }
      celula.alignment = { horizontal: "center" };
    }

    // Adicionar saldo
    const celulaSaldo = linha.getCell(numColunas);
    if (eEmFerias) {
      celulaSaldo.value = "Férias";
      celulaSaldo.font = { color: { argb: "FFFFA500" }, italic: true, bold: true }; // Laranja
    } else if (eEmAtestado) {
      celulaSaldo.value = "Atestado";
      celulaSaldo.font = { color: { argb: "FF4169E1" }, italic: true, bold: true }; // Azul
    } else if (diaValido && !diasJustificados.has(dataStr)) {
      const horasAbs = Math.abs(saldoDia);
      const horasInt = Math.floor(horasAbs);
      const minutos = Math.round((horasAbs - horasInt) * 60);
      const sinal = saldoDia >= 0 ? "+" : "-";
      celulaSaldo.value = `${sinal}${horasInt}h${String(minutos).padStart(
        2,
        "0"
      )}min`;

      // Cor baseada no saldo
      if (saldoDia > 0) {
        celulaSaldo.font = { color: { argb: "FF008000" }, bold: true }; // Verde
      } else if (saldoDia < 0) {
        celulaSaldo.font = { color: { argb: "FFFF0000" }, bold: true }; // Vermelho
      }
    } else if (diasJustificados.has(dataStr)) {
      celulaSaldo.value = "Justificado";
      celulaSaldo.font = { color: { argb: "FF0066CC" }, italic: true };
    } else {
      celulaSaldo.value = "-";
    }
    celulaSaldo.alignment = { horizontal: "center" };

    // Aplicar bordas
    for (let col = 1; col <= numColunas; col++) {
      linha.getCell(col).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      linha.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    // Alternar cor de fundo
    if (linhaAtual % 2 === 0) {
      for (let col = 1; col <= numColunas; col++) {
        linha.getCell(col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    }

    linhaAtual++;
  }

  // Calcular banco de horas acumulado (mesma lógica das outras funções)
  let bancoHorasAcumulado = 0;
  let mesCursor = new Date(
    dataInicioBanco.getFullYear(),
    dataInicioBanco.getMonth(),
    1
  );
  const fimConsulta = new Date(parseInt(ano), parseInt(mes) - 1, 1);

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);

    const eMesAtualCursor =
      mesCursorNum === mesAtual && anoCursorNum === anoAtual;
    const dataLimiteCursor = eMesAtualCursor ? hoje : fimMesCursor;
    const ultimoDiaCursor = eMesAtualCursor
      ? hoje.getDate()
      : fimMesCursor.getDate();

    let primeiroDiaCursor = 1;
    if (
      dataInicioBanco.getFullYear() === anoCursorNum &&
      dataInicioBanco.getMonth() + 1 === mesCursorNum
    ) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: funcionario_id,
        batida_data_hora: {
          [Op.between]: [
            inicioMesCursor,
            new Date(
              dataLimiteCursor.getFullYear(),
              dataLimiteCursor.getMonth(),
              dataLimiteCursor.getDate(),
              23,
              59,
              59,
              999
            ),
          ],
        },
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    const batidasPorDiaMes = {};
    batidasMes.forEach((b) => {
      const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
      if (!batidasPorDiaMes[dataStr]) batidasPorDiaMes[dataStr] = [];
      batidasPorDiaMes[dataStr].push(b);
    });

    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: funcionario_id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: {
          [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
        },
      },
    });
    const diasJustificadosMes = new Set(
      justificativasMes.map((j) => {
        const data = j.justificativa_data;
        // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
        return typeof data === "string"
          ? data
          : new Date(data).toISOString().split("T")[0];
      })
    );

    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const dataDia = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = dataDia.toISOString().split("T")[0];

      if (diasJustificadosMes.has(dataStr)) continue;

      // Verificar se é férias ou atestado e pular se for
      const eEmFerias = await isEmFerias(funcionario_id, dataDia);
      const eEmAtestado = await isEmAtestado(funcionario_id, dataDia);
      if (eEmFerias || eEmAtestado) continue;

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      
      // Verificar se é feriado/domingo
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(funcionario_id, dataDia);
      const horasPrevistasDia = eFeriadoOuDomingo ? null : getHorasPrevistasDia(perfil, dataDia);

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = 0;
      let horasNegativasDia = 0;

      if (eFeriadoOuDomingo) {
        // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
        horasExtrasDia = horasTrabalhadasDia * 2;
        horasNegativasDia = 0;
      } else {
        if (horasPrevistasDia === null || horasPrevistasDia === 0) {
          // Se não há horas previstas, todas as horas trabalhadas são extras
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistasDia);
          horasNegativasDia = Math.max(0, horasPrevistasDia - horasTrabalhadasDia);

          const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
          horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia =
            horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          if (
            dataDia < hoje &&
            horasPrevistasDia > 0 &&
            batidasDoDia.length === 0
          ) {
            horasNegativasDia = horasPrevistasDia;
          }
        }
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
        );
        const saidasDoDia = batidasValidasDoDia.filter(
          (b) => b.batida_tipo === "saida"
        );
        deveIncluirNoBanco = saidasDoDia.length >= 2;
      }

      // Somar ao banco de horas apenas se atender os critérios
      if (deveIncluirNoBanco) {
        bancoHorasAcumulado += horasExtrasDia - horasNegativasDia;
      }
    }

    mesCursor = new Date(mesCursor.getFullYear(), mesCursor.getMonth() + 1, 1);
  }

  // Linha em branco
  linhaAtual++;

  // Linha de resumo: Saldo do Mês
  const metadeColunas = Math.floor(numColunas / 2);
  worksheet.mergeCells(linhaAtual, 1, linhaAtual, metadeColunas);
  const celulaSaldoMesLabel = worksheet.getCell(linhaAtual, 1);
  celulaSaldoMesLabel.value = "Saldo do Mês:";
  celulaSaldoMesLabel.font = { bold: true, size: 12 };
  celulaSaldoMesLabel.alignment = { horizontal: "right", vertical: "middle" };

  worksheet.mergeCells(linhaAtual, metadeColunas + 1, linhaAtual, numColunas);
  const celulaSaldoMesValor = worksheet.getCell(linhaAtual, metadeColunas + 1);
  const saldoMesAbs = Math.abs(saldoMes);
  const saldoMesHoras = Math.floor(saldoMesAbs);
  const saldoMesMin = Math.round((saldoMesAbs - saldoMesHoras) * 60);
  const saldoMesSinal = saldoMes >= 0 ? "+" : "-";
  celulaSaldoMesValor.value = `${saldoMesSinal}${saldoMesHoras}h${String(
    saldoMesMin
  ).padStart(2, "0")}min`;
  celulaSaldoMesValor.font = {
    bold: true,
    size: 12,
    color: { argb: saldoMes >= 0 ? "FF008000" : "FFFF0000" },
  };
  celulaSaldoMesValor.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(linhaAtual).height = 25;

  linhaAtual++;

  // Linha de resumo: Saldo do Banco de Horas
  worksheet.mergeCells(linhaAtual, 1, linhaAtual, metadeColunas);
  const celulaBancoLabel = worksheet.getCell(linhaAtual, 1);
  celulaBancoLabel.value = "Saldo do Banco de Horas:";
  celulaBancoLabel.font = { bold: true, size: 12 };
  celulaBancoLabel.alignment = { horizontal: "right", vertical: "middle" };

  worksheet.mergeCells(linhaAtual, metadeColunas + 1, linhaAtual, numColunas);
  const celulaBancoValor = worksheet.getCell(linhaAtual, metadeColunas + 1);
  const bancoAbs = Math.abs(bancoHorasAcumulado);
  const bancoHoras = Math.floor(bancoAbs);
  const bancoMin = Math.round((bancoAbs - bancoHoras) * 60);
  const bancoSinal = bancoHorasAcumulado >= 0 ? "+" : "-";
  celulaBancoValor.value = `${bancoSinal}${bancoHoras}h${String(
    bancoMin
  ).padStart(2, "0")}min`;
  celulaBancoValor.font = {
    bold: true,
    size: 12,
    color: { argb: bancoHorasAcumulado >= 0 ? "FF008000" : "FFFF0000" },
  };
  celulaBancoValor.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(linhaAtual).height = 25;

  // Configurar resposta
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  
  // Garantir que o nome do funcionário está definido
  const nomeFuncionarioSanitizado = nomeFuncionario || "funcionario";
  
  // Criar nome do arquivo
  const nomeArquivo = `ponto_${ano}_${String(parseInt(mes)).padStart(2, "0")}_${nomeFuncionarioSanitizado}.xlsx`;
  
  // Enviar header com o nome do arquivo (usando formato compatível)
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`
  );

  // Enviar arquivo
  await workbook.xlsx.write(res);
  res.end();
}

// Função auxiliar para gerar Excel em buffer para um funcionário
async function gerarExcelFuncionario(funcionario_id, mes, ano) {
  const usuarioAlvo = await Usuario.findByPk(funcionario_id, {
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
    ],
  });

  if (!usuarioAlvo) {
    return null;
  }

  const nomeEmpresa =
    usuarioAlvo.empresa?.empresa_nome || "Empresa não vinculada";
  
  const nomeCompleto = usuarioAlvo.usuario_nome || "Funcionario";
  
  const normalizarAcentos = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .trim();
  };
  
  let nomeFuncionario = nomeCompleto.trim().replace(/\s+/g, " ");
  nomeFuncionario = normalizarAcentos(nomeFuncionario)
    .replace(/\s+/g, "_")
    .toLowerCase();
  
  if (!nomeFuncionario || nomeFuncionario.length === 0) {
    nomeFuncionario = "funcionario";
  }

  const dataCriacaoUsuario = usuarioAlvo.usuario_data_criacao
    ? parseDateOnly(usuarioAlvo.usuario_data_criacao)
    : null;

  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);

  const ultimoDiaConsiderado = eMesAtual ? hoje.getDate() : fimMes.getDate();

  let primeiroDiaValido = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDiaValido = criacaoDia;
    }
  }

  const dataLimite = eMesAtual ? hoje : fimMes;
  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: funcionario_id,
      batida_data_hora: {
        [Op.between]: [
          inicioMes,
          new Date(
            dataLimite.getFullYear(),
            dataLimite.getMonth(),
            dataLimite.getDate(),
            23,
            59,
            59,
            999
          ),
        ],
      },
      batida_status: { [Op.in]: ["normal", "aprovada"] },
    },
    order: [["batida_data_hora", "ASC"]],
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: funcionario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
      justificativa_status: "aprovada",
      justificativa_tipo: { [Op.in]: ["falta_justificada", "consulta_medica"] },
    },
  });
  const diasJustificados = new Set(
    justificativas.map((j) => {
      const data = j.justificativa_data;
      return typeof data === "string"
        ? data
        : new Date(data).toISOString().split("T")[0];
    })
  );

  const batidasPorDia = {};
  batidas.forEach((b) => {
    const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
    if (!batidasPorDia[dataStr]) batidasPorDia[dataStr] = [];
    batidasPorDia[dataStr].push(b);
  });

  const perfil = await getPerfilJornadaUsuario(funcionario_id);

  let maxBatidas = 0;
  Object.values(batidasPorDia).forEach((batidasDia) => {
    if (batidasDia.length > maxBatidas) maxBatidas = batidasDia.length;
  });
  maxBatidas = Math.max(maxBatidas, 4);
  if (maxBatidas % 2 !== 0) maxBatidas++;

  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const mesesPt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `Ponto ${mesesPt[parseInt(mes) - 1]} ${ano}`
  );

  const numColunas = 2 + maxBatidas + 1;

  worksheet.mergeCells(1, 1, 1, numColunas);
  const celulaEmpresa = worksheet.getCell(1, 1);
  celulaEmpresa.value = nomeEmpresa;
  celulaEmpresa.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  celulaEmpresa.alignment = { horizontal: "center", vertical: "middle" };
  celulaEmpresa.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" },
  };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(2, 1, 2, numColunas);
  const celulaFuncionario = worksheet.getCell(2, 1);
  celulaFuncionario.value = nomeCompleto;
  celulaFuncionario.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  celulaFuncionario.alignment = { horizontal: "center", vertical: "middle" };
  celulaFuncionario.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2E5A8F" },
  };
  worksheet.getRow(2).height = 25;

  const cabecalhos = ["Data", "Dia da Semana"];
  for (let i = 0; i < maxBatidas; i++) {
    cabecalhos.push(
      i % 2 === 0
        ? `Entrada ${Math.floor(i / 2) + 1}`
        : `Saída ${Math.floor(i / 2) + 1}`
    );
  }
  cabecalhos.push("Saldo");

  const linhaCabecalho = worksheet.getRow(3);
  cabecalhos.forEach((cab, index) => {
    const celula = linhaCabecalho.getCell(index + 1);
    celula.value = cab;
    celula.font = { bold: true, size: 11 };
    celula.alignment = { horizontal: "center", vertical: "middle" };
    celula.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    celula.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  worksheet.getRow(3).height = 22;

  worksheet.getColumn(1).width = 12;
  worksheet.getColumn(2).width = 18;
  for (let i = 3; i <= 2 + maxBatidas; i++) {
    worksheet.getColumn(i).width = 10;
  }
  worksheet.getColumn(numColunas).width = 12;

  let linhaAtual = 4;
  let saldoMes = 0;

  const bancoHorasRecord = await BancoHoras.findOne({
    where: { banco_usuario_id: funcionario_id },
  });

  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHorasRecord?.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHorasRecord.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  for (let dia = 1; dia <= ultimoDiaConsiderado; dia++) {
    const data = new Date(parseInt(ano), parseInt(mes) - 1, dia);
    const dataStr = data.toISOString().split("T")[0];
    const diaValido = dia >= primeiroDiaValido;

    const dataFormatada = `${String(dia).padStart(2, "0")}/${String(
      parseInt(mes)
    ).padStart(2, "0")}/${ano}`;
    const diaSemana = diasSemana[data.getDay()];

    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistasDia = getHorasPrevistasDia(perfil, data);

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let saldoDia = 0;

    if (diaValido && !diasJustificados.has(dataStr)) {
      horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

      if (horasPrevistasDia === null || horasPrevistasDia === 0) {
        // Se não há horas previstas, todas as horas trabalhadas são extras
        horasExtras = horasTrabalhadas;
        horasNegativas = 0;
      } else {
        horasExtras = Math.max(0, horasTrabalhadas - horasPrevistasDia);
        horasNegativas = Math.max(0, horasPrevistasDia - horasTrabalhadas);

        const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
        horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
        horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

        if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
          horasNegativas = horasPrevistasDia;
        }
      }

      saldoDia = horasExtras - horasNegativas;
      saldoMes += saldoDia;
    }

    const linha = worksheet.getRow(linhaAtual);
    linha.getCell(1).value = dataFormatada;
    linha.getCell(2).value = diaSemana;

    for (let i = 0; i < maxBatidas; i++) {
      const celula = linha.getCell(3 + i);
      if (batidasDoDia[i]) {
        const horaBatida = new Date(batidasDoDia[i].batida_data_hora);
        celula.value = horaBatida.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        if (batidasDoDia[i].batida_alterada) {
          celula.value += " (alterada)";
        }
      } else {
        celula.value = "-";
      }
      celula.alignment = { horizontal: "center" };
    }

    const celulaSaldo = linha.getCell(numColunas);
    if (diaValido && !diasJustificados.has(dataStr)) {
      const horasAbs = Math.abs(saldoDia);
      const horasInt = Math.floor(horasAbs);
      const minutos = Math.round((horasAbs - horasInt) * 60);
      const sinal = saldoDia >= 0 ? "+" : "-";
      celulaSaldo.value = `${sinal}${horasInt}h${String(minutos).padStart(
        2,
        "0"
      )}min`;

      if (saldoDia > 0) {
        celulaSaldo.font = { color: { argb: "FF008000" }, bold: true };
      } else if (saldoDia < 0) {
        celulaSaldo.font = { color: { argb: "FFFF0000" }, bold: true };
      }
    } else if (diasJustificados.has(dataStr)) {
      celulaSaldo.value = "Justificado";
      celulaSaldo.font = { color: { argb: "FF0066CC" }, italic: true };
    } else {
      celulaSaldo.value = "-";
    }
    celulaSaldo.alignment = { horizontal: "center" };

    for (let col = 1; col <= numColunas; col++) {
      linha.getCell(col).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      linha.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    if (linhaAtual % 2 === 0) {
      for (let col = 1; col <= numColunas; col++) {
        linha.getCell(col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    }

    linhaAtual++;
  }

  linhaAtual++;
  const metadeColunas = Math.floor(numColunas / 2);
  worksheet.mergeCells(linhaAtual, 1, linhaAtual, metadeColunas);
  const celulaSaldoMesLabel = worksheet.getCell(linhaAtual, 1);
  celulaSaldoMesLabel.value = "Saldo do Mês:";
  celulaSaldoMesLabel.font = { bold: true, size: 12 };
  celulaSaldoMesLabel.alignment = { horizontal: "right", vertical: "middle" };

  worksheet.mergeCells(linhaAtual, metadeColunas + 1, linhaAtual, numColunas);
  const celulaSaldoMesValor = worksheet.getCell(linhaAtual, metadeColunas + 1);
  const saldoMesAbs = Math.abs(saldoMes);
  const saldoMesHoras = Math.floor(saldoMesAbs);
  const saldoMesMin = Math.round((saldoMesAbs - saldoMesHoras) * 60);
  const saldoMesSinal = saldoMes >= 0 ? "+" : "-";
  celulaSaldoMesValor.value = `${saldoMesSinal}${saldoMesHoras}h${String(
    saldoMesMin
  ).padStart(2, "0")}min`;
  celulaSaldoMesValor.font = {
    bold: true,
    size: 12,
    color: { argb: saldoMes >= 0 ? "FF008000" : "FFFF0000" },
  };
  celulaSaldoMesValor.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(linhaAtual).height = 25;

  // Gerar buffer do Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    nomeArquivo: `ponto_${ano}_${String(parseInt(mes)).padStart(2, "0")}_${nomeFuncionario}.xlsx`,
  };
}

// Exportar todos os pontos de todas as empresas em ZIP
export async function exportarTodosPontosZip(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  // Importar archiver
  const archiverModule = await import("archiver");
  const archiver = archiverModule.default || archiverModule;

  // Buscar todas as empresas
  const empresas = await Empresa.findAll({
    order: [["empresa_nome", "ASC"]],
  });

  // Configurar resposta primeiro
  res.setHeader("Content-Type", "application/zip");
  const nomeArquivo = `pontos_todas_empresas_${ano}_${String(parseInt(mes)).padStart(2, "0")}.zip`;
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${nomeArquivo}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`
  );

  // Criar ZIP e fazer pipe para a resposta
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  // Pipe do ZIP para a resposta
  archive.pipe(res);

  // Função para normalizar nome de pasta
  const normalizarNomePasta = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();
  };

  // Processar cada empresa
  for (const empresa of empresas) {
    // Buscar funcionários da empresa (usuários com perfil_jornada_id)
    const funcionarios = await Usuario.findAll({
      where: {
        usuario_empresa_id: empresa.empresa_id,
        usuario_ativo: 1,
        usuario_perfil_jornada_id: { [Op.not]: null },
      },
      order: [["usuario_nome", "ASC"]],
    });

    if (funcionarios.length === 0) {
      continue; // Pular empresa sem funcionários que batem ponto
    }

    // Normalizar nome da pasta da empresa
    const nomePastaEmpresa = normalizarNomePasta(empresa.empresa_nome) || "empresa_sem_nome";

    // Processar cada funcionário
    for (const funcionario of funcionarios) {
      try {
        const excelData = await gerarExcelFuncionario(
          funcionario.usuario_id,
          mes,
          ano
        );

        if (excelData && excelData.buffer) {
          // Adicionar arquivo ao ZIP dentro da pasta da empresa
          archive.append(excelData.buffer, {
            name: `${nomePastaEmpresa}/${excelData.nomeArquivo}`,
          });
        }
      } catch (error) {
        console.error(
          `Erro ao gerar Excel para funcionário ${funcionario.usuario_id}:`,
          error
        );
        // Continuar com os próximos funcionários mesmo se houver erro
      }
    }
  }

  // Finalizar ZIP
  await archive.finalize();
}

// Listar funcionários desligados (usuários do tipo Funcionário inativos)
export async function getFuncionariosDesligados(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  const { empresa_id } = req.query;

  // Buscar usuários do tipo Funcionário (que têm perfil_jornada_id e funcionario_id)
  // Não filtrar por usuario_ativo aqui, pois queremos incluir todos os funcionários desligados
  const whereClause = {
    usuario_perfil_jornada_id: { [Op.not]: null },
    usuario_funcionario_id: { [Op.not]: null },
  };

  if (empresa_id) {
    whereClause.usuario_empresa_id = empresa_id;
  }

  const usuarios = await Usuario.findAll({
    where: whereClause,
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
        required: false,
      },
      {
        model: Funcionario,
        as: "funcionario",
        attributes: [
          "funcionario_id",
          "funcionario_nome",
          "funcionario_ativo",
          "funcionario_data_desligamento",
        ],
        required: true, // Deve ter funcionário vinculado
      },
    ],
    order: [["usuario_nome", "ASC"]],
  });

  // Filtrar aqueles onde o funcionário está inativo OU o usuário está inativo
  const funcionariosDesligados = usuarios
    .filter((u) => {
      // Deve ter funcionário vinculado
      if (!u.funcionario) return false;
      
      // Incluir se:
      // 1. O funcionário está inativo (funcionario_ativo === 0)
      // 2. OU o usuário está inativo (usuario_ativo === 0)
      const funcionarioInativo = u.funcionario.funcionario_ativo === 0;
      const usuarioInativo = u.usuario_ativo === 0;
      
      return funcionarioInativo || usuarioInativo;
    })
    .map((u) => ({
      id: u.usuario_id,
      nome: u.usuario_nome,
      empresa_id: u.usuario_empresa_id,
      empresa_nome: u.empresa?.empresa_nome,
      data_desligamento: u.funcionario?.funcionario_data_desligamento || null,
      funcionario_id: u.usuario_funcionario_id,
      usuario_ativo: u.usuario_ativo,
      funcionario_ativo: u.funcionario?.funcionario_ativo,
    }));

  return res.status(200).json({
    funcionarios: funcionariosDesligados,
  });
}

// Obter histórico de funcionário desligado (até a data de desligamento)
export async function getHistoricoFuncionarioDesligado(req, res) {
  const usuario = req.user;
  const permissoes = usuario.permissoes || [];

  if (
    !permissoes.includes("ponto.aprovar_justificativas") &&
    !permissoes.includes("ponto.alterar_batidas")
  ) {
    throw ApiError.forbidden(
      "Você não tem permissão para acessar esta funcionalidade"
    );
  }

  const { id } = req.params;
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  const usuarioAlvo = await Usuario.findByPk(id, {
    include: [
      {
        model: Funcionario,
        as: "funcionario",
        required: true,
      },
    ],
  });

  if (!usuarioAlvo || !usuarioAlvo.funcionario) {
    throw ApiError.notFound("Usuário/Funcionário não encontrado");
  }

  const funcionario = usuarioAlvo.funcionario;

  // Verificar se o funcionário está desligado OU o usuário está inativo
  const funcionarioInativo = funcionario.funcionario_ativo === 0;
  const usuarioInativo = usuarioAlvo.usuario_ativo === 0;
  
  if (!funcionarioInativo && !usuarioInativo) {
    throw ApiError.badRequest("Funcionário/Usuário não está inativo");
  }

  // Obter data de criação do usuário (precisa estar antes para usar na lógica abaixo)
  const dataCriacaoUsuario = usuarioAlvo.usuario_data_criacao
    ? parseDateOnly(usuarioAlvo.usuario_data_criacao)
    : null;

  // Obter data de desligamento (se o funcionário estiver inativo)
  // Se apenas o usuário estiver inativo, buscar a última batida de ponto para usar como data limite
  let dataDesligamento = null;
  
  if (funcionarioInativo) {
    dataDesligamento = funcionario.funcionario_data_desligamento
      ? parseDateOnly(funcionario.funcionario_data_desligamento)
      : null;
    
    if (!dataDesligamento) {
      // Se não tem data de desligamento mas o funcionário está inativo, buscar última batida
      const ultimaBatida = await BatidaPonto.findOne({
        where: {
          batida_usuario_id: id,
          batida_status: { [Op.in]: ["normal", "aprovada"] },
        },
        order: [["batida_data_hora", "DESC"]],
      });
      
      if (ultimaBatida) {
        dataDesligamento = getDataBrasilia(new Date(ultimaBatida.batida_data_hora));
      } else {
        // Se não há batidas, usar data de criação do usuário
        dataDesligamento = dataCriacaoUsuario || getDataBrasilia();
      }
    }
  } else {
    // Se apenas o usuário está inativo, buscar a última batida de ponto
    const ultimaBatida = await BatidaPonto.findOne({
      where: {
        batida_usuario_id: id,
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "DESC"]],
    });
    
    if (ultimaBatida) {
      // Usar a data da última batida como data de inativação
      dataDesligamento = getDataBrasilia(new Date(ultimaBatida.batida_data_hora));
    } else {
      // Se não há batidas, usar data de criação do usuário
      dataDesligamento = dataCriacaoUsuario || getDataBrasilia();
    }
  }

  // Verificar se o mês solicitado é após o desligamento
  const mesSolicitado = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const mesDesligamento = new Date(
    dataDesligamento.getFullYear(),
    dataDesligamento.getMonth(),
    1
  );

  if (mesSolicitado > mesDesligamento) {
    throw ApiError.badRequest(
      "Não é possível visualizar pontos após a data de desligamento"
    );
  }

  // Verificar se é o mês atual para limitar até a data atual ou data de desligamento
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);

  // Limitar até a data de desligamento ou fim do mês, o que for menor
  const dataLimite = eMesAtual
    ? dataDesligamento < hoje
      ? dataDesligamento
      : hoje
    : dataDesligamento < fimMes
    ? dataDesligamento
    : fimMes;

  let ultimoDiaConsiderado = Math.min(
    fimMes.getDate(),
    dataLimite.getDate()
  );

  // Calcular primeiro dia válido baseado na data de criação
  let primeiroDiaValido = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDiaValido = criacaoDia;
    } else if (
      criacaoAno > parseInt(ano) ||
      (criacaoAno === parseInt(ano) && criacaoMes > parseInt(mes))
    ) {
      primeiroDiaValido = ultimoDiaConsiderado + 1;
    }
  }

  // Limitar até a data de desligamento
  const diaDesligamento = dataDesligamento.getDate();
  const mesDesligamentoNumLocal = dataDesligamento.getMonth() + 1;
  const anoDesligamentoLocal = dataDesligamento.getFullYear();

  if (
    anoDesligamentoLocal === parseInt(ano) &&
    mesDesligamentoNumLocal === parseInt(mes)
  ) {
    ultimoDiaConsiderado = Math.min(ultimoDiaConsiderado, diaDesligamento);
  }

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: id,
      justificativa_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
    },
  });

  // Buscar batidas do mês (até a data limite)
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(dataLimite);
  fimDiaMes.setHours(23, 59, 59, 999);

  const batidas = await BatidaPonto.findAll({
    where: {
      batida_usuario_id: id,
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
      batida_id: b.batida_id,
      batida_tipo: b.batida_tipo,
      batida_data_hora: b.batida_data_hora,
      batida_status: b.batida_status,
    });
  });

  // Organizar justificativas por dia
  const justificativasPorDia = {};
  justificativas.forEach((j) => {
    const dataStr = formatarDataStr(j.justificativa_data);
    if (!justificativasPorDia[dataStr]) {
      justificativasPorDia[dataStr] = [];
    }
    justificativasPorDia[dataStr].push(j);
  });

  // Buscar perfil de jornada para calcular horas previstas
  const perfil = await getPerfilJornadaUsuario(id);

  // Normalizar data de desligamento para comparação (apenas data, sem horas)
  // Definir antes dos loops para usar em múltiplos lugares
  const dataDesligamentoOnly = getDataBrasilia(dataDesligamento);

  // Montar resposta - calcular horas em tempo real
  const diasDoMes = [];
  let totalHorasPrevistas = 0;
  let totalHorasTrabalhadas = 0;
  let totalHorasExtras = 0;
  let totalHorasNegativas = 0;

  for (let dia = 1; dia <= ultimoDiaConsiderado; dia++) {
    const data = new Date(parseInt(ano), parseInt(mes) - 1, dia);
    const dataStr = data.toISOString().split("T")[0];

    // Verificar se o dia é válido (após data de criação e antes/igual à data de desligamento)
    const diaValido = dia >= primeiroDiaValido;
    // Comparar apenas datas, sem horas
    const dataDiaOnly = getDataBrasilia(data);
    const diaAntesDesligamento = dataDiaOnly <= dataDesligamentoOnly;

    // Pular dias antes da data de cadastro ou após a data de inativação - não exibir no histórico
    if (!diaValido || !diaAntesDesligamento) {
      continue;
    }

    // Verificar se é feriado/domingo, férias ou atestado
    const nomeFeriado = await getNomeFeriado(id, data);
    const eFeriadoOuDomingo = nomeFeriado !== null;
    const feriasPeriodoDia = await getFeriasPeriodo(id, data);
    const emFerias = !!feriasPeriodoDia;
    const emAtestado = await isEmAtestado(id, data);
    const eDiaNaoUtil = eFeriadoOuDomingo || emFerias || emAtestado;

    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistasDia = eDiaNaoUtil
      ? null
      : getHorasPrevistasDia(perfil, data);

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let status = "normal";

    // Calcular horas trabalhadas em tempo real baseado nas batidas válidas
    const batidasValidas = batidasDoDia.filter(
      (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
    );
    horasTrabalhadas = calcularHorasTrabalhadas(batidasValidas);

    // Calcular extras e negativas
    if (eFeriadoOuDomingo) {
      horasExtras = horasTrabalhadas * 2;
      horasNegativas = 0;
    } else if (emFerias || emAtestado) {
      horasExtras = horasTrabalhadas;
      horasNegativas = 0;
    } else {
      horasExtras = horasPrevistasDia
        ? Math.max(0, horasTrabalhadas - horasPrevistasDia)
        : 0;
      horasNegativas = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadas)
        : 0;

      // Aplicar tolerância de 10 minutos
      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
      horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

      // Verificar se é uma falta (dia que já passou, sem batidas, que deveria ter trabalhado)
      if (
        data < hoje &&
        horasPrevistasDia > 0 &&
        batidasDoDia.length === 0
      ) {
        horasNegativas = horasPrevistasDia;
        status = "divergente";
      } else if (horasExtras > 0 || horasNegativas > 0) {
        status = "divergente";
      }
    }

    // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), zerar horas negativas
    const justificativasDoDia = justificativasPorDia[dataStr] || [];
    const temJustificativaAprovada = justificativasDoDia.some(
      (j) =>
        j.justificativa_status === "aprovada" &&
        !["falta_nao_justificada", "horas_extras"].includes(
          j.justificativa_tipo
        )
    );
    if (temJustificativaAprovada) {
      horasNegativas = 0;
    }

    // Verificar se é o dia atual e se deve incluir nos totais
    const hojeStr = hoje.toISOString().split("T")[0];
    const eDiaAtual = dataStr === hojeStr;

    // Se for o dia atual, só incluir nos totais se houver pelo menos 2 saídas
    let deveIncluirNosTotais = true;
    if (eDiaAtual) {
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) =>
          b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );
      const saidasDoDia = batidasValidasDoDia.filter(
        (b) => b.batida_tipo === "saida"
      );
      deveIncluirNosTotais = saidasDoDia.length >= 2;
    }

    // Somar aos totais apenas para dias válidos e que atendam os critérios
    if (deveIncluirNosTotais) {
      totalHorasPrevistas += horasPrevistasDia || 0;
      totalHorasTrabalhadas += horasTrabalhadas;
      totalHorasExtras += horasExtras;
      totalHorasNegativas += horasNegativas;
    }

    const saldoDia = horasExtras - horasNegativas;

    diasDoMes.push({
      data: dataStr,
      horasTrabalhadas,
      horasExtras,
      horasNegativas,
      saldoDia,
      horasPrevistas: horasPrevistasDia || 0,
      status,
      batidas: batidasDoDia,
      justificativas: justificativasPorDia[dataStr] || [],
      diaValido: true, // Todos os dias aqui são válidos (já filtrados acima)
      feriado: nomeFeriado || null,
      emFerias: emFerias,
      ferias: feriasPeriodoDia,
    });
  }

  // Calcular horas pendentes (previstas - trabalhadas, se positivo)
  const horasPendentes = Math.max(
    0,
    totalHorasPrevistas - totalHorasTrabalhadas
  );

  // Calcular banco de horas ACUMULADO até a data de desligamento/inativação
  // A data limite é: data de criação até data de inativação (última batida ou data de desligamento do funcionário)
  const bancoHorasRecord = await BancoHoras.findOne({
    where: { banco_usuario_id: id },
  });

  let dataInicioBanco = dataCriacaoUsuario || new Date(0);
  if (bancoHorasRecord?.banco_data_inicio) {
    const dataInicioRecord = parseDateOnly(bancoHorasRecord.banco_data_inicio);
    if (dataInicioRecord > dataInicioBanco) {
      dataInicioBanco = dataInicioRecord;
    }
  }

  // Limitar data de início do banco à data de desligamento
  if (dataInicioBanco > dataDesligamentoOnly) {
    dataInicioBanco = dataDesligamentoOnly;
  }

  let bancoHorasAcumulado = 0;
  
  // Obter informações do mês de desligamento para usar no loop
  const mesDesligamentoNumBanco = dataDesligamento.getMonth() + 1;
  const anoDesligamentoBanco = dataDesligamento.getFullYear();

  // Iterar por todos os meses desde dataInicioBanco até o mês do desligamento
  // IMPORTANTE: Sempre calcular até a data de desligamento, não apenas até o mês visualizado
  // O banco de horas acumulado deve mostrar o total desde a criação até a inativação
  let mesCursor = new Date(
    dataInicioBanco.getFullYear(),
    dataInicioBanco.getMonth(),
    1
  );
  // Sempre usar o mês de desligamento como fim, não o mês solicitado
  const fimConsulta = mesDesligamento;

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);

    // Limitar até a data de desligamento
    const dataLimiteCursor =
      mesCursorNum === mesDesligamentoNumBanco &&
      anoCursorNum === anoDesligamentoBanco
        ? dataDesligamento
        : fimMesCursor;
    const ultimoDiaCursor = dataLimiteCursor.getDate();

    let primeiroDiaCursor = 1;
    if (
      dataInicioBanco.getFullYear() === anoCursorNum &&
      dataInicioBanco.getMonth() + 1 === mesCursorNum
    ) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    // Buscar batidas do mês
    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: id,
        batida_data_hora: {
          [Op.between]: [
            inicioMesCursor,
            new Date(
              dataLimiteCursor.getFullYear(),
              dataLimiteCursor.getMonth(),
              dataLimiteCursor.getDate(),
              23,
              59,
              59,
              999
            ),
          ],
        },
        batida_status: { [Op.in]: ["normal", "aprovada"] },
      },
      order: [["batida_data_hora", "ASC"]],
    });

    // Organizar batidas por dia
    const batidasPorDiaMes = {};
    batidasMes.forEach((b) => {
      const dataStr = new Date(b.batida_data_hora).toISOString().split("T")[0];
      if (!batidasPorDiaMes[dataStr]) batidasPorDiaMes[dataStr] = [];
      batidasPorDiaMes[dataStr].push(b);
    });

    // Buscar justificativas aprovadas do mês (exceto falta_nao_justificada e horas_extras)
    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: {
          [Op.notIn]: ["falta_nao_justificada", "horas_extras"],
        },
      },
    });
    const diasJustificados = new Set(
      justificativasMes.map((j) => {
        const data = j.justificativa_data;
        return typeof data === "string"
          ? data
          : new Date(data).toISOString().split("T")[0];
      })
    );

    // Calcular horas do mês
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const dataDia = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = dataDia.toISOString().split("T")[0];

      // Não incluir dias após desligamento (comparar apenas datas, sem horas)
      const dataDiaOnly = getDataBrasilia(dataDia);
      if (dataDiaOnly > dataDesligamentoOnly) {
        continue;
      }

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];

      // Filtrar apenas batidas válidas
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );

      // Verificar se é feriado/domingo, férias ou atestado
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(id, dataDia);
      const eEmFerias = await isEmFerias(id, dataDia);
      const eEmAtestado = await isEmAtestado(id, dataDia);
      const eDiaNaoUtil = eFeriadoOuDomingo || eEmFerias || eEmAtestado;
      const horasPrevistasDia = eDiaNaoUtil
        ? null
        : getHorasPrevistasDia(perfil, dataDia);

      // Se o dia tem justificativa aprovada, não conta horas negativas
      if (diasJustificados.has(dataStr)) {
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasValidasDoDia);

      let horasExtrasDia = 0;
      let horasNegativasDia = 0;

      if (eFeriadoOuDomingo) {
        horasExtrasDia = horasTrabalhadasDia * 2;
        horasNegativasDia = 0;
      } else if (eEmFerias || eEmAtestado) {
        horasExtrasDia = horasTrabalhadasDia;
        horasNegativasDia = 0;
      } else {
        if (horasPrevistasDia === null || horasPrevistasDia === 0) {
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistasDia);
          horasNegativasDia = Math.max(
            0,
            horasPrevistasDia - horasTrabalhadasDia
          );

          // Aplicar tolerância
          const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
          horasExtrasDia =
            horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia =
            horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          // Se é falta (sem batida em dia que deveria trabalhar)
          // Mas só considerar falta se o dia for antes da data de inativação
          const dataDiaOnly = getDataBrasilia(dataDia);
          const hojeOnly = getDataBrasilia();
          if (
            dataDiaOnly < hojeOnly &&
            dataDiaOnly <= dataDesligamentoOnly &&
            horasPrevistasDia > 0 &&
            batidasValidasDoDia.length === 0
          ) {
            horasNegativasDia = horasPrevistasDia;
          }
        }
      }

      // Verificar se é o dia atual ou dia de inativação e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const dataDesligamentoStr = dataDesligamentoOnly.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;
      const eDiaInativacao = dataStr === dataDesligamentoStr;

      // Se for o dia atual ou dia de inativação, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual || eDiaInativacao) {
        const saidasDoDia = batidasValidasDoDia.filter(
          (b) => b.batida_tipo === "saida"
        );
        deveIncluirNoBanco = saidasDoDia.length >= 2;
      }

      // Somar ao banco de horas apenas se atender os critérios
      if (deveIncluirNoBanco) {
        bancoHorasAcumulado += horasExtrasDia - horasNegativasDia;
      }
    }

    // Avançar para o próximo mês
    mesCursor = new Date(mesCursor.getFullYear(), mesCursor.getMonth() + 1, 1);
  }

  return res.status(200).json({
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
      dataCriacao: dataCriacaoUsuario
        ? formatarDataStr(dataCriacaoUsuario)
        : null,
      dataDesligamento: formatarDataStr(dataDesligamento),
    },
    dias: diasDoMes,
    bancoHoras: bancoHorasAcumulado,
    resumoMes: {
      horasPrevistas: totalHorasPrevistas,
      horasTrabalhadas: totalHorasTrabalhadas,
      horasExtras: totalHorasExtras,
      horasNegativas: totalHorasNegativas,
      horasPendentes: horasPendentes,
      eMesAtual: false,
      dataLimite: formatarDataStr(dataDesligamento),
      primeiroDiaValido: primeiroDiaValido,
    },
  });
}
