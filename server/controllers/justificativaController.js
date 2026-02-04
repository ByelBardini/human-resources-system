import path from "path";
import {
  Usuario,
  Justificativa,
  BatidaPonto,
  DiaTrabalhado,
  PerfilJornada,
  BancoHoras,
  Notificacao,
  Feriado,
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

// Função para formatar data DATEONLY para string YYYY-MM-DD
function formatarDataStr(data) {
  if (!data) return null;
  if (typeof data === "string") return data.split("T")[0];
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

// Função para verificar se uma data é feriado ou domingo
async function isFeriadoOuDomingo(usuario_id, data) {
  const dataBrasilia = new Date(data);
  const diaSemana = dataBrasilia.getDay();
  if (diaSemana === 0) {
    return true;
  }

  const dataStr = formatarDataStr(dataBrasilia);

  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_empresa_id"],
  });

  const empresa_id = usuario?.usuario_empresa_id || null;

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

// Função para verificar divergências (tolerância de 10 minutos)
function verificarDivergencias(
  batidas,
  horasPrevistas,
  entradaPrevista,
  saidaPrevista
) {
  const divergencias = [];

  // Filtrar apenas batidas válidas (normal ou aprovada)
  const batidasValidas = batidas.filter(
    (b) => b.batida_status !== "recusada" && b.batida_status !== "pendente"
  );

  // Verificar batidas faltantes
  const entradas = batidasValidas.filter((b) => b.batida_tipo === "entrada");
  const saidas = batidasValidas.filter((b) => b.batida_tipo === "saida");

  if (entradas.length === 0 && horasPrevistas && horasPrevistas > 0) {
    divergencias.push("Falta batida de entrada");
  }

  if (saidas.length === 0 && horasPrevistas && horasPrevistas > 0) {
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

// Função para atualizar o status do dia após uma justificativa ser processada
// tipo: tipo da justificativa
// aprovada: se foi aprovada (true) ou recusada (false)
async function atualizarDiaAposJustificativa(diaTrabalhado, tipo, aprovada) {
  if (!diaTrabalhado) return;

  // Tipos que NÃO devem zerar horas negativas mesmo quando aprovadas
  const tiposQueNaoZeramHorasNegativas = ["falta_nao_justificada", "horas_extras"];

  // Se a justificativa foi aprovada e não é um tipo que mantém horas negativas, zerar as horas negativas
  if (aprovada && !tiposQueNaoZeramHorasNegativas.includes(tipo)) {
    // Qualquer justificativa aprovada (exceto falta_nao_justificada e horas_extras) zera as horas negativas
    diaTrabalhado.dia_horas_negativas = 0;
  }

  switch (tipo) {
    case "falta_justificada":
    case "consulta_medica":
    case "atestado":
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
      // Para outros tipos aprovados, zerar horas negativas e marcar como normal
      if (aprovada) {
        diaTrabalhado.dia_status = "normal";
      } else {
        // Se recusada, apenas marcar como normal
        diaTrabalhado.dia_status = "normal";
      }
      break;
  }

  diaTrabalhado.dia_ultima_atualizacao = getDataHoraBrasilia();
  await diaTrabalhado.save();
}

// Verifica se deve criar notificação de falta e cria se necessário
export async function verificarECriarFalta(usuario_id, data) {
  if (!usuario_id || !data) return;

  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_id", "usuario_funcionario_id"],
  });
  if (!usuario?.usuario_funcionario_id) return;

  const funcionario_id = usuario.usuario_funcionario_id;
  const dataParsed = typeof data === "string" ? parseDateOnly(data) : new Date(data);
  const dataStr = formatarDataStr(dataParsed);
  if (!dataStr) return;

  // Considerar apenas dias úteis (não feriado/domingo e com horas previstas > 0)
  const eFeriadoOuDomingo = await isFeriadoOuDomingo(usuario_id, dataParsed);
  if (eFeriadoOuDomingo) return;

  const perfil = await getPerfilJornadaUsuario(usuario_id);
  const horasPrevistas = getHorasPrevistasDia(perfil, dataParsed);
  if (!horasPrevistas || horasPrevistas <= 0) return;

  const inicioDia = new Date(dataParsed);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataParsed);
  fimDia.setHours(23, 59, 59, 999);

  const [batidas, justificativas] = await Promise.all([
    BatidaPonto.findAll({
      where: {
        batida_usuario_id: usuario_id,
        batida_data_hora: { [Op.between]: [inicioDia, fimDia] },
      },
      order: [["batida_data_hora", "ASC"]],
    }),
    Justificativa.findAll({
      where: {
        justificativa_usuario_id: usuario_id,
        justificativa_data: dataStr,
      },
    }),
  ]);

  const batidasValidas = batidas.filter(
    (b) => b.batida_status === "normal" || b.batida_status === "aprovada"
  );

  // Caso 1: Nenhuma batida válida E (justificativa recusada OU falta_nao_justificada)
  const temJustificativaRecusada = justificativas.some(
    (j) => j.justificativa_status === "recusada"
  );
  const temFaltaNaoJustificada = justificativas.some(
    (j) => j.justificativa_tipo === "falta_nao_justificada"
  );

  // Caso 2: Todas batidas manuais recusadas (batida_observacao != null) E nenhuma válida
  const batidasManuais = batidas.filter((b) => b.batida_observacao != null);
  const todasManuaisRecusadas =
    batidas.length > 0 &&
    batidasManuais.length === batidas.length &&
    batidas.every((b) => b.batida_status === "recusada");

  const deveCriarFalta =
    batidasValidas.length === 0 &&
    (temJustificativaRecusada || temFaltaNaoJustificada || todasManuaisRecusadas);

  if (!deveCriarFalta) return;

  // Evitar duplicatas
  const dataInicio = `${dataStr} 00:00:00`;
  const dataFim = `${dataStr} 23:59:59`;
  const existente = await Notificacao.findOne({
    where: {
      notificacao_funcionario_id: funcionario_id,
      notificacao_tipo: "falta",
      notificacao_data: { [Op.between]: [dataInicio, dataFim] },
    },
  });
  if (existente) return;

  await Notificacao.create({
    notificacao_funcionario_id: funcionario_id,
    notificacao_tipo: "falta",
    notificacao_data: dataInicio,
    notificacao_descricao: "Falta detectada automaticamente pelo sistema",
  });
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

  if (tipo === "atestado" && !anexoCaminho) {
    throw ApiError.badRequest("Anexo do atestado médico é obrigatório para justificativa tipo atestado");
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

  // Verificar se é feriado ou domingo
  const eFeriadoOuDomingo = await isFeriadoOuDomingo(usuario_id, dataJustificativa);

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(usuario_id);
  const horasPrevistas = eFeriadoOuDomingo ? null : (getHorasPrevistasDia(perfil, dataJustificativa) || 0);

  // Calcular horários previstos para verificação de divergências
  let entradaPrevista = null;
  let saidaPrevista = null;
  if (!eFeriadoOuDomingo && horasPrevistas && horasPrevistas > 0) {
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

  // Verificar divergências de batidas (entrada atrasada, saída antecipada, etc.)
  const divergencias = verificarDivergencias(
    batidas,
    horasPrevistas,
    entradaPrevista,
    saidaPrevista
  );

  // Calcular horas trabalhadas
  const horasTrabalhadas = calcularHorasTrabalhadas(batidas);

  // Calcular extras e negativas
  let horasExtras = 0;
  let horasNegativas = 0;

  if (eFeriadoOuDomingo) {
    // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
    horasExtras = horasTrabalhadas * 2;
    horasNegativas = 0;
  } else {
    if (horasPrevistas === null || horasPrevistas === 0) {
      // Se não há horas previstas, todas as horas trabalhadas são extras
      horasExtras = horasTrabalhadas;
      horasNegativas = 0;
    } else {
      horasExtras = Math.max(0, horasTrabalhadas - horasPrevistas);
      horasNegativas = Math.max(0, horasPrevistas - horasTrabalhadas);

      // Aplicar tolerância
      const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
      horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
      horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

      // Verificar se é falta (dia sem batida)
      const hoje = getDataHoraBrasilia();
      if (dataJustificativa < hoje && horasPrevistas > 0 && batidas.length === 0) {
        horasNegativas = horasPrevistas;
      }
    }
  }

  // Determinar se é divergente: divergente se houver divergências de batidas OU horas extras/negativas
  // Em feriados/domingos, não considerar horas extras como divergência, mas considerar divergências de batidas
  let eDivergente = false;
  if (divergencias.length > 0) {
    eDivergente = true;
  } else if (!eFeriadoOuDomingo && (horasExtras > 0 || horasNegativas > 0)) {
    eDivergente = true;
  }

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
    await verificarECriarFalta(usuario_id, dataJustificativa);
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
  const { dias_atestado } = req.body || {};

  const justificativa = await Justificativa.findByPk(id, {
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: ["usuario_id", "usuario_nome", "usuario_funcionario_id"],
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

  // Registrar atestado em notificações quando justificativa tipo "atestado" for aprovada
  if (
    justificativa.justificativa_tipo === "atestado" &&
    justificativa.justificativa_anexo_caminho
  ) {
    const dias = parseInt(dias_atestado, 10);
    if (!Number.isInteger(dias) || dias < 1) {
      throw ApiError.badRequest(
        "Para aprovar atestado, informe a quantidade de dias (número inteiro maior que zero)"
      );
    }

    const funcionarioId =
      justificativa.usuario?.usuario_funcionario_id ??
      (await Usuario.findByPk(justificativa.justificativa_usuario_id, {
        attributes: ["usuario_funcionario_id"],
      }).then((u) => u?.usuario_funcionario_id ?? null));

    if (funcionarioId) {
      try {
        const rawPath = justificativa.justificativa_anexo_caminho;
        const relPath =
          path.isAbsolute(rawPath) || rawPath.includes(":\\")
            ? path.relative(process.cwd(), rawPath)
            : rawPath;
        const notificacaoAnexo = relPath.replace(/\\/g, "/").replace(/^\.\/?/, "");

        const dataInicio = new Date(justificativa.justificativa_data);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + dias - 1);

        const pad = (n) => String(n).padStart(2, "0");
        const dataInicioStr = `${dataInicio.getFullYear()}-${pad(dataInicio.getMonth() + 1)}-${pad(dataInicio.getDate())} 00:00:00`;
        const dataFimStr = `${dataFim.getFullYear()}-${pad(dataFim.getMonth() + 1)}-${pad(dataFim.getDate())} 23:59:59`;

        await Notificacao.create({
          notificacao_funcionario_id: funcionarioId,
          notificacao_tipo: "atestado",
          notificacao_data: dataInicioStr,
          notificacao_data_final: dataFimStr,
          notificacao_descricao:
            justificativa.justificativa_descricao ||
            `Atestado médico (${dias} dia${dias > 1 ? "s" : ""})`,
          notificacao_imagem_caminho: notificacaoAnexo,
        });
      } catch (err) {
        if (err instanceof ApiError) throw err;
        console.error("Erro ao registrar atestado na aprovação:", err);
      }
    }
  }

  // Processar justificativa aprovada (para tipos que precisam criar batidas, etc.)
  if (
    ![
      "falta_justificada",
      "consulta_medica",
      "falta_nao_justificada",
      "horas_extras",
      "atestado",
    ].includes(justificativa.justificativa_tipo)
  ) {
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

  await verificarECriarFalta(
    justificativa.justificativa_usuario_id,
    justificativa.justificativa_data
  );

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
