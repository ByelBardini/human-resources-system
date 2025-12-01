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
function calcularHorasTrabalhadas(batidas) {
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

  // Obter saldo do banco de horas
  const bancoHoras = await BancoHoras.findOne({
    where: { banco_usuario_id: usuario_id },
  });
  const saldoBancoHoras = bancoHoras ? bancoHoras.banco_saldo / 60 : 0; // Converter minutos para horas

  return res.status(200).json({
    funcionario: {
      nome: usuario.usuario_nome,
    },
    dataAtual: dataAtual.toISOString().split("T")[0],
    jornadaPrevista: horasPrevistas
      ? `${horasPrevistas.toFixed(2)}h`
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

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_usuario_id: id,
      dia_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
    order: [["dia_data", "ASC"]],
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: id,
      justificativa_data: {
        [Op.between]: [inicioMes, fimMes],
      },
    },
  });

  // Buscar batidas do mês
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(fimMes);
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
    batidasPorDia[dataStr].push(b);
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

  // Montar resposta
  const diasDoMes = [];
  for (let dia = 1; dia <= fimMes.getDate(); dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = data.toISOString().split("T")[0];
    const diaTrabalhado = diasTrabalhados.find((d) => {
      const diaDataStr = formatarDataStr(d.dia_data);
      return diaDataStr === dataStr;
    });

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
      batidas: batidasPorDia[dataStr] || [],
      justificativas: justificativasPorDia[dataStr] || [],
    });
  }

  // Obter banco de horas
  const bancoHoras = await BancoHoras.findOne({
    where: { banco_usuario_id: id },
  });

  return res.status(200).json({
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
    },
    dias: diasDoMes,
    bancoHoras: bancoHoras ? bancoHoras.banco_saldo / 60 : 0,
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

  // Zerar o banco de horas
  bancoHoras.banco_saldo = 0;
  bancoHoras.banco_ultima_atualizacao = new Date();
  await bancoHoras.save();

  return res.status(200).json({
    mensagem: "Banco de horas fechado com sucesso",
    saldoAnterior: saldoAnterior / 60,
    funcionario: {
      id: usuarioAlvo.usuario_id,
      nome: usuarioAlvo.usuario_nome,
    },
  });
}

// Recalcular banco de horas desde a criação do usuário
export async function recalcularBancoHoras(req, res) {
  requirePermissao(req, "ponto.alterar_batidas");

  const { funcionario_id } = req.params;

  const usuarioAlvo = await Usuario.findByPk(funcionario_id);
  if (!usuarioAlvo) {
    throw ApiError.notFound("Usuário não encontrado");
  }

  // Buscar todos os dias trabalhados do usuário
  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: { dia_usuario_id: funcionario_id },
    order: [["dia_data", "ASC"]],
  });

  // Calcular saldo total
  let saldoTotalMinutos = 0;
  diasTrabalhados.forEach((dia) => {
    const extras = parseFloat(dia.dia_horas_extras || 0);
    const negativas = parseFloat(dia.dia_horas_negativas || 0);
    saldoTotalMinutos += Math.round((extras - negativas) * 60);
  });

  // Atualizar banco de horas
  const [bancoHoras] = await BancoHoras.findOrCreate({
    where: { banco_usuario_id: funcionario_id },
    defaults: { banco_saldo: 0 },
  });

  const saldoAnterior = bancoHoras.banco_saldo;
  bancoHoras.banco_saldo = saldoTotalMinutos;
  bancoHoras.banco_ultima_atualizacao = new Date();
  await bancoHoras.save();

  return res.status(200).json({
    mensagem: "Banco de horas recalculado com sucesso",
    saldoAnterior: saldoAnterior / 60,
    saldoNovo: saldoTotalMinutos / 60,
    diasProcessados: diasTrabalhados.length,
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
