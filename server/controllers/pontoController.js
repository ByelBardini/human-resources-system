import {
  Usuario,
  BatidaPonto,
  PerfilJornada,
  DiaTrabalhado,
  BancoHoras,
  Justificativa,
  Empresa,
} from "../models/index.js";
import { Op } from "sequelize";
import { ApiError } from "../middlewares/ApiError.js";
import { formatarHorasParaHHMM } from "../utils/formatarHoras.js";

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
  const horasPrevistas = getHorasPrevistasDia(perfil, data);

  let entradaPrevista = null;
  let saidaPrevista = null;

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

  // Filtrar apenas batidas válidas (não recusadas e não pendentes)
  const batidasValidas = batidas.filter(
    (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
  );

  const horasTrabalhadas = calcularHorasTrabalhadas(batidasValidas);
  const horasExtras = horasPrevistas
    ? Math.max(0, horasTrabalhadas - horasPrevistas)
    : 0;
  const horasNegativas = horasPrevistas
    ? Math.max(0, horasPrevistas - horasTrabalhadas)
    : 0;

  // Tolerância de 10 minutos
  const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
  const horasExtrasAjustadas = horasExtras > toleranciaHoras ? horasExtras : 0;
  const horasNegativasAjustadas =
    horasNegativas > toleranciaHoras ? horasNegativas : 0;

  const divergencias = verificarDivergencias(
    batidasValidas,
    horasPrevistas,
    entradaPrevista,
    saidaPrevista
  );

  const status =
    divergencias.length > 0 ||
    horasExtrasAjustadas > 0 ||
    horasNegativasAjustadas > 0
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
  const usuario = req.user;

  // Usar fuso horário de Brasília
  const agora = getDataHoraBrasilia();
  const dataAtual = getDataBrasilia(agora);

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
  const horasPrevistas = getHorasPrevistasDia(perfil, dataAtual);

  // Calcular horas trabalhadas em tempo real baseado nas batidas válidas
  const horasTrabalhadasCalculadas = calcularHorasTrabalhadas(batidas);

  // Calcular extras e negativas
  const horasExtrasCalculadas = horasPrevistas
    ? Math.max(0, horasTrabalhadasCalculadas - horasPrevistas)
    : 0;
  const horasNegativasCalculadas = horasPrevistas
    ? Math.max(0, horasPrevistas - horasTrabalhadasCalculadas)
    : 0;

  // Aplicar tolerância de 10 minutos
  const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
  const horasExtrasAjustadas =
    horasExtrasCalculadas > toleranciaHoras ? horasExtrasCalculadas : 0;
  const horasNegativasAjustadas =
    horasNegativasCalculadas > toleranciaHoras ? horasNegativasCalculadas : 0;

  // Determinar status
  const statusCalculado =
    horasExtrasAjustadas > 0 || horasNegativasAjustadas > 0
      ? "divergente"
      : "normal";

  const proximaBatida = determinarProximaBatida(batidas);

  // Calcular saldo do banco de horas ACUMULADO (desde a data de início até hoje)
  const usuarioCompleto = await Usuario.findByPk(usuario_id);
  const dataCriacaoUsuario = usuarioCompleto?.usuario_data_criacao
    ? parseDateOnly(usuarioCompleto.usuario_data_criacao)
    : null;

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
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const dataDia = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = dataDia.toISOString().split("T")[0];

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      const horasPrevistasDia = getHorasPrevistasDia(perfil, dataDia);

      // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), não conta horas negativas
      if (diasJustificados.has(dataStr)) {
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = horasPrevistasDia
        ? Math.max(0, horasTrabalhadasDia - horasPrevistasDia)
        : 0;
      let horasNegativasDia = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadasDia)
        : 0;

      // Aplicar tolerância
      horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
      horasNegativasDia =
        horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

      // Verificar falta (dia sem batida que deveria ter trabalhado)
      if (
        dataDia < dataAtual &&
        horasPrevistasDia > 0 &&
        batidasDoDia.length === 0
      ) {
        horasNegativasDia = horasPrevistasDia;
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const dataAtualStr = dataAtual.toISOString().split("T")[0];
      const eDiaAtual = dataStr === dataAtualStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) =>
            b.batida_status !== "recusada" && b.batida_status !== "pendente"
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
    },
    dataAtual: dataAtual.toISOString().split("T")[0],
    jornadaPrevista: horasPrevistas
      ? formatarHorasParaHHMM(horasPrevistas)
      : "Não definida",
    batidas: batidas.map((b) => ({
      id: b.batida_id,
      tipo: b.batida_tipo,
      dataHora: b.batida_data_hora,
      status: b.batida_status,
    })),
    proximaBatida,
    resumo:
      batidas.length > 0
        ? {
            horasTrabalhadas: horasTrabalhadasCalculadas,
            horasExtras: horasExtrasAjustadas,
            horasNegativas: horasNegativasAjustadas,
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
    ],
    order: [["usuario_nome", "ASC"]],
  });

  return res.status(200).json({
    funcionarios: usuarios.map((u) => ({
      id: u.usuario_id,
      nome: u.usuario_nome,
      empresa_id: u.usuario_empresa_id,
      empresa_nome: u.empresa?.empresa_nome,
    })),
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

    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistasDia = getHorasPrevistasDia(perfil, data) || 0;

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let status = "normal";

    if (diaValido) {
      // Calcular horas trabalhadas em tempo real baseado nas batidas válidas
      const batidasValidas = batidasDoDia.filter(
        (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
      );
      horasTrabalhadas = calcularHorasTrabalhadas(batidasValidas);

      // Calcular extras e negativas
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
        totalHorasPrevistas += horasPrevistasDia;
        totalHorasTrabalhadas += horasTrabalhadas;
        totalHorasExtras += horasExtras;
        totalHorasNegativas += horasNegativas;
      }
    }
    // Para dias antes da criação do usuário: manter tudo como 0 e status normal

    diasDoMes.push({
      data: dataStr,
      horasTrabalhadas,
      horasExtras,
      horasNegativas,
      horasPrevistas: diaValido ? horasPrevistasDia : 0,
      status,
      batidas: batidasDoDia,
      justificativas: justificativasPorDia[dataStr] || [],
      diaValido, // Indica se o dia conta para o funcionário
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
      const horasPrevistasDia = getHorasPrevistasDia(perfil, data);

      // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), não conta horas negativas
      if (diasJustificados.has(dataStr)) {
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = horasPrevistasDia
        ? Math.max(0, horasTrabalhadasDia - horasPrevistasDia)
        : 0;
      let horasNegativasDia = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadasDia)
        : 0;

      // Aplicar tolerância
      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
      horasNegativasDia =
        horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

      // Se é falta (sem batida em dia que deveria trabalhar)
      if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
        horasNegativasDia = horasPrevistasDia;
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) =>
            b.batida_status !== "recusada" && b.batida_status !== "pendente"
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
        attributes: ["usuario_id", "usuario_nome"],
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
        attributes: ["usuario_id", "usuario_nome"],
      },
    ],
    order: [["batida_data_hora", "DESC"]],
  });

  // Mapear para formato compatível com frontend
  const justificativasMapeadas = justificativasPendentes.map((j) => ({
    ...j.toJSON(),
    funcionario: j.usuario
      ? {
          funcionario_id: j.usuario.usuario_id,
          funcionario_nome: j.usuario.usuario_nome,
        }
      : null,
  }));

  const batidasMapeadas = batidasPendentes.map((b) => ({
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

  return res.status(200).json({
    batida,
    mensagem: "Batida reprovada",
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
      const horasPrevistasDia = getHorasPrevistasDia(perfil, dataDia);

      // Se o dia foi justificado como falta, não conta como negativo
      if (diasJustificados.has(dataStr)) {
        diasProcessados++;
        continue;
      }

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = horasPrevistasDia
        ? Math.max(0, horasTrabalhadasDia - horasPrevistasDia)
        : 0;
      let horasNegativasDia = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadasDia)
        : 0;

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

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) =>
            b.batida_status !== "recusada" && b.batida_status !== "pendente"
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

  // Verificar se é o mês atual para limitar até a data atual
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);

  const ultimoDiaConsiderado = eMesAtual ? hoje.getDate() : fimMes.getDate();

  // Calcular primeiro dia válido baseado na data de criação
  let primeiroDiaValido = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDiaValido = criacaoDia;
    }
  }

  // Buscar todas as batidas do mês
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
    const horasPrevistasDia = getHorasPrevistasDia(perfil, data) || 0;

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let saldoDia = 0;

    if (diaValido && !diasJustificados.has(dataStr)) {
      horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

      horasExtras = horasPrevistasDia
        ? Math.max(0, horasTrabalhadas - horasPrevistasDia)
        : 0;
      horasNegativas = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadas)
        : 0;

      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
      horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

      // Falta sem batida
      if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
        horasNegativas = horasPrevistasDia;
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
      } else {
        celula.value = "-";
      }
      celula.alignment = { horizontal: "center" };
    }

    // Adicionar saldo
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

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      const horasPrevistasDia = getHorasPrevistasDia(perfil, dataDia);

      let horasTrabalhadasDia = calcularHorasTrabalhadas(batidasDoDia);

      let horasExtrasDia = horasPrevistasDia
        ? Math.max(0, horasTrabalhadasDia - horasPrevistasDia)
        : 0;
      let horasNegativasDia = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadasDia)
        : 0;

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

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;

      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const batidasValidasDoDia = batidasDoDia.filter(
          (b) =>
            b.batida_status !== "recusada" && b.batida_status !== "pendente"
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
    const horasPrevistasDia = getHorasPrevistasDia(perfil, data) || 0;

    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let horasNegativas = 0;
    let saldoDia = 0;

    if (diaValido && !diasJustificados.has(dataStr)) {
      horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

      horasExtras = horasPrevistasDia
        ? Math.max(0, horasTrabalhadas - horasPrevistasDia)
        : 0;
      horasNegativas = horasPrevistasDia
        ? Math.max(0, horasPrevistasDia - horasTrabalhadas)
        : 0;

      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
      horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

      if (data < hoje && horasPrevistasDia > 0 && batidasDoDia.length === 0) {
        horasNegativas = horasPrevistasDia;
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
