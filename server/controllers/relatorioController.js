import {
  Usuario,
  DiaTrabalhado,
  Justificativa,
  BancoHoras,
  BatidaPonto,
  PerfilJornada,
  Feriado,
  Empresa,
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
    (b) => b.status !== "recusada" && b.status !== "pendente"
  );

  // Verificar batidas faltantes
  const entradas = batidasValidas.filter((b) => b.tipo === "entrada");
  const saidas = batidasValidas.filter((b) => b.tipo === "saida");

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
    const entrada = new Date(entradas[0].dataHora);
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
    const saida = new Date(saidas[saidas.length - 1].dataHora);
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

// Função para obter horas previstas do dia baseado no perfil
function getHorasPrevistasDia(perfil, data) {
  if (!perfil) return null;

  const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, etc.
  const diasMap = {
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };

  // Domingo não tem campo no perfil
  if (diaSemana === 0) return null;

  const campoDia = `perfil_jornada_${diasMap[diaSemana]}`;
  const horas = parseFloat(perfil[campoDia] || 0);

  if (horas === 0) return null;

  return horas;
}

// Função para obter data/hora atual no fuso horário de Brasília
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

// Função para converter data DATEONLY (string YYYY-MM-DD) para objeto Date local sem problemas de timezone
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString().split('T')[0];
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Obter relatório mensal
export async function getRelatorioMensal(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);
  const usuario = req.user;

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  // Obter data de criação do usuário (usando parseDateOnly para evitar problemas de timezone)
  const usuarioCompleto = await Usuario.findByPk(usuario_id);
  const dataCriacaoUsuario = usuarioCompleto?.usuario_data_criacao 
    ? parseDateOnly(usuarioCompleto.usuario_data_criacao)
    : null;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);
  
  // Calcular data limite (hoje ou fim do mês, o que for menor)
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;
  
  // Se for mês atual, mostrar só até hoje
  const dataLimite = eMesAtual ? hoje : fimMes;
  const ultimoDia = eMesAtual ? hoje.getDate() : fimMes.getDate();

  // Calcular primeiro dia a mostrar (data de criação do usuário ou início do mês)
  let primeiroDia = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    // Se a criação foi neste mês/ano, começar a partir do dia de criação
    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDia = criacaoDia;
    }
    // Se a criação foi após este mês, não mostrar nada
    else if (criacaoAno > parseInt(ano) || (criacaoAno === parseInt(ano) && criacaoMes > parseInt(mes))) {
      return res.status(200).json({ 
        dias: [],
        info: {
          mensagem: "O usuário ainda não existia neste período",
          dataCriacao: formatarDataStr(dataCriacaoUsuario),
        }
      });
    }
  }

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(usuario_id);

  const diasTrabalhados = await DiaTrabalhado.findAll({
    where: {
      dia_usuario_id: usuario_id,
      dia_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
    },
    order: [["dia_data", "ASC"]],
  });

  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: usuario_id,
      justificativa_data: {
        [Op.between]: [inicioMes, dataLimite],
      },
    },
    order: [["justificativa_data", "DESC"]],
  });

  // Buscar batidas do mês (até a data limite)
  const inicioDiaMes = new Date(inicioMes);
  inicioDiaMes.setHours(0, 0, 0, 0);
  const fimDiaMes = new Date(dataLimite);
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

  // Criar array com os dias do mês (do primeiro dia válido até a data limite)
  const diasDoMes = [];
  for (let dia = primeiroDia; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = data.toISOString().split("T")[0];

    // Verificar se é feriado
    const nomeFeriado = await getNomeFeriado(usuario_id, data);
    const eFeriadoOuDomingo = nomeFeriado !== null;

    // Buscar batidas do dia
    const batidasDoDia = batidasPorDia[dataStr] || [];
    const horasPrevistas = eFeriadoOuDomingo ? null : getHorasPrevistasDia(perfil, data);

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
      batidasDoDia,
      horasPrevistas,
      entradaPrevista,
      saidaPrevista
    );

    // Calcular horas trabalhadas em tempo real baseado nas batidas
    let horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

    // Calcular extras e negativas
    let horasExtras = 0;
    let horasNegativas = 0;

    if (eFeriadoOuDomingo) {
      // Em feriados/domingos: todas as horas trabalhadas são extras e dobradas
      horasExtras = horasTrabalhadas * 2;
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

          // Aplicar tolerância de 10 minutos
          const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
          horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
          horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

          // Verificar se é uma falta (dia sem batida que deveria ter trabalhado)
          // Se o dia já passou, deveria ter trabalhado (horasPrevistas > 0), não bateu ponto
          if (data < hoje && horasPrevistas > 0 && batidasDoDia.length === 0) {
            // É uma falta - considerar como horas negativas
            horasNegativas = horasPrevistas;
          }
        }
      }

    // Determinar status: divergente se houver divergências de batidas OU horas extras/negativas
    // Em feriados/domingos, não considerar horas extras como divergência, mas considerar divergências de batidas
    let status = "normal";
    if (divergencias.length > 0) {
      status = "divergente";
    } else if (!eFeriadoOuDomingo && (horasExtras > 0 || horasNegativas > 0)) {
      status = "divergente";
    }

    // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), zerar horas negativas
    const justificativasDoDia = justificativasPorData[dataStr] || [];
    const temJustificativaAprovada = justificativasDoDia.some(
      (j) => 
        j.justificativa_status === "aprovada" &&
        !["falta_nao_justificada", "horas_extras"].includes(j.justificativa_tipo)
    );
    if (temJustificativaAprovada) {
      horasNegativas = 0;
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
      feriado: nomeFeriado || null,
    });
  }

  return res.status(200).json({ 
    dias: diasDoMes,
    info: {
      eMesAtual,
      dataLimite: formatarDataStr(dataLimite),
      dataCriacao: dataCriacaoUsuario ? formatarDataStr(dataCriacaoUsuario) : null,
      primeiroDiaExibido: primeiroDia,
    }
  });
}

// Obter totais mensais (calculado em tempo real)
export async function getTotaisMensais(req, res) {
  requirePermissao(req, "ponto.registrar");

  const usuario_id = getUsuarioId(req);

  const { mes, ano } = req.query;

  if (!mes || !ano) {
    throw ApiError.badRequest("Mês e ano são obrigatórios");
  }

  // Obter data de criação do usuário (usando parseDateOnly para evitar problemas de timezone)
  const usuarioCompleto = await Usuario.findByPk(usuario_id);
  const dataCriacaoUsuario = usuarioCompleto?.usuario_data_criacao 
    ? parseDateOnly(usuarioCompleto.usuario_data_criacao)
    : null;

  const inicioMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
  const fimMes = new Date(parseInt(ano), parseInt(mes), 0);
  
  // Calcular data limite (hoje ou fim do mês, o que for menor)
  const hoje = getDataBrasilia();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const eMesAtual = parseInt(mes) === mesAtual && parseInt(ano) === anoAtual;
  const dataLimite = eMesAtual ? hoje : fimMes;
  const ultimoDia = eMesAtual ? hoje.getDate() : fimMes.getDate();

  // Calcular primeiro dia baseado na criação do usuário
  let primeiroDia = 1;
  if (dataCriacaoUsuario) {
    const criacaoAno = dataCriacaoUsuario.getFullYear();
    const criacaoMes = dataCriacaoUsuario.getMonth() + 1;
    const criacaoDia = dataCriacaoUsuario.getDate();

    // Se a criação foi neste mês/ano, começar a partir do dia de criação
    if (criacaoAno === parseInt(ano) && criacaoMes === parseInt(mes)) {
      primeiroDia = criacaoDia;
    }
    // Se a criação foi após este mês, retornar totais zerados
    else if (criacaoAno > parseInt(ano) || (criacaoAno === parseInt(ano) && criacaoMes > parseInt(mes))) {
      const bancoHoras = await BancoHoras.findOne({
        where: { banco_usuario_id: usuario_id },
      });
      return res.status(200).json({
        horasTrabalhadas: 0,
        horasExtras: 0,
        horasNegativas: 0,
        diasDivergentes: 0,
        justificativasPendentes: 0,
        justificativasAprovadas: 0,
        batidasPendentes: 0,
        bancoHoras: bancoHoras ? bancoHoras.banco_saldo / 60 : 0,
      });
    }
  }

  // Buscar perfil de jornada
  const perfil = await getPerfilJornadaUsuario(usuario_id);

  // Buscar justificativas do período
  const justificativas = await Justificativa.findAll({
    where: {
      justificativa_usuario_id: usuario_id,
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

  // Contar batidas pendentes
  const batidasPendentes = batidas.filter(b => b.batida_status === "pendente").length;

  // Organizar justificativas por data
  const justificativasPorData = {};
  justificativas.forEach((j) => {
    const dataStr = formatarDataStr(j.justificativa_data);
    if (!justificativasPorData[dataStr]) {
      justificativasPorData[dataStr] = [];
    }
    justificativasPorData[dataStr].push(j);
  });

  // Calcular totais em tempo real (mesma lógica do getRelatorioMensal)
  const totais = {
    horasTrabalhadas: 0,
    horasExtras: 0,
    horasNegativas: 0,
    diasDivergentes: 0,
    justificativasPendentes: 0,
    justificativasAprovadas: 0,
    batidasPendentes,
  };

  // Iterar por cada dia do período válido
  for (let dia = primeiroDia; dia <= ultimoDia; dia++) {
    const data = new Date(parseInt(ano), parseInt(mes) - 1, dia);
    const dataStr = data.toISOString().split("T")[0];

    const batidasDoDia = batidasPorDia[dataStr] || [];
    
    // Verificar se é feriado
    const nomeFeriado = await getNomeFeriado(usuario_id, data);
    const eFeriadoOuDomingo = nomeFeriado !== null;
    const horasPrevistas = eFeriadoOuDomingo ? null : getHorasPrevistasDia(perfil, data);

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
      batidasDoDia,
      horasPrevistas,
      entradaPrevista,
      saidaPrevista
    );

    // Calcular horas trabalhadas em tempo real baseado nas batidas
    let horasTrabalhadas = calcularHorasTrabalhadas(batidasDoDia);

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

        // Aplicar tolerância de 10 minutos
        const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
        horasExtras = horasExtras > toleranciaHoras ? horasExtras : 0;
        horasNegativas = horasNegativas > toleranciaHoras ? horasNegativas : 0;

        // Verificar se é uma falta (dia sem batida que deveria ter trabalhado)
        if (data < hoje && horasPrevistas > 0 && batidasDoDia.length === 0) {
          horasNegativas = horasPrevistas;
        }
      }
    }

    // Se o dia tem justificativa aprovada (exceto falta_nao_justificada e horas_extras), zerar horas negativas
    const justificativasDoDia = justificativasPorData[dataStr] || [];
    const temJustificativaAprovada = justificativasDoDia.some(
      (j) => 
        j.justificativa_status === "aprovada" &&
        !["falta_nao_justificada", "horas_extras"].includes(j.justificativa_tipo)
    );
    if (temJustificativaAprovada) {
      horasNegativas = 0;
    }

    // Verificar se é o dia atual e se deve incluir nos totais
    const hojeStr = hoje.toISOString().split("T")[0];
    const eDiaAtual = dataStr === hojeStr;
    
    // Se for o dia atual, só incluir nos totais se houver pelo menos 2 saídas válidas
    let deveIncluirNosTotais = true;
    if (eDiaAtual) {
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) => b.status !== "recusada" && b.status !== "pendente"
      );
      const saidasDoDia = batidasValidasDoDia.filter((b) => b.tipo === "saida");
      deveIncluirNosTotais = saidasDoDia.length >= 2;
    }

    // Determinar status: divergente se houver divergências de batidas OU horas extras/negativas
    // Em feriados/domingos, não considerar horas extras como divergência, mas considerar divergências de batidas
    let status = "normal";
    if (divergencias.length > 0) {
      status = "divergente";
    } else if (!eFeriadoOuDomingo && (horasExtras > 0 || horasNegativas > 0)) {
      status = "divergente";
    }

    // Somar aos totais apenas se atender os critérios
    if (deveIncluirNosTotais) {
      totais.horasTrabalhadas += horasTrabalhadas;
      totais.horasExtras += horasExtras;
      totais.horasNegativas += horasNegativas;
      if (status === "divergente") {
        totais.diasDivergentes++;
      }
    }
  }

  // Contar justificativas
  justificativas.forEach((j) => {
    if (j.justificativa_status === "pendente") {
      totais.justificativasPendentes++;
    } else if (j.justificativa_status === "aprovada") {
      totais.justificativasAprovadas++;
    }
  });

  // Calcular saldo do banco de horas ACUMULADO (desde a data de início até o mês consultado)
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

  // Calcular o banco de horas acumulado de todos os meses desde dataInicioBanco até o mês consultado
  let bancoHorasAcumulado = 0;

  // Iterar por todos os meses desde dataInicioBanco até o mês consultado
  let mesCursor = new Date(dataInicioBanco.getFullYear(), dataInicioBanco.getMonth(), 1);
  const fimConsulta = new Date(parseInt(ano), parseInt(mes) - 1, 1);

  while (mesCursor <= fimConsulta) {
    const mesCursorNum = mesCursor.getMonth() + 1;
    const anoCursorNum = mesCursor.getFullYear();

    // Definir período do mês
    const inicioMesCursor = new Date(anoCursorNum, mesCursorNum - 1, 1);
    const fimMesCursor = new Date(anoCursorNum, mesCursorNum, 0);
    
    // Verificar se é o mês atual (para limitar até hoje)
    const eMesAtualCursor = mesCursorNum === mesAtual && anoCursorNum === anoAtual;
    const dataLimiteCursor = eMesAtualCursor ? hoje : fimMesCursor;
    const ultimoDiaCursor = eMesAtualCursor ? hoje.getDate() : fimMesCursor.getDate();

    // Calcular primeiro dia válido deste mês
    let primeiroDiaCursor = 1;
    if (dataInicioBanco.getFullYear() === anoCursorNum && dataInicioBanco.getMonth() + 1 === mesCursorNum) {
      primeiroDiaCursor = dataInicioBanco.getDate();
    }

    // Buscar batidas do mês
    const batidasMes = await BatidaPonto.findAll({
      where: {
        batida_usuario_id: usuario_id,
        batida_data_hora: {
          [Op.between]: [inicioMesCursor, new Date(dataLimiteCursor.getFullYear(), dataLimiteCursor.getMonth(), dataLimiteCursor.getDate(), 23, 59, 59, 999)],
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
      batidasPorDiaMes[dataStr].push({
        dataHora: b.batida_data_hora,
        tipo: b.batida_tipo,
        status: b.batida_status,
      });
    });

    // Buscar justificativas aprovadas do mês (exceto falta_nao_justificada e horas_extras)
    const justificativasMes = await Justificativa.findAll({
      where: {
        justificativa_usuario_id: usuario_id,
        justificativa_data: {
          [Op.between]: [inicioMesCursor, dataLimiteCursor],
        },
        justificativa_status: "aprovada",
        justificativa_tipo: { [Op.notIn]: ["falta_nao_justificada", "horas_extras"] },
      },
    });
    const diasJustificados = new Set(justificativasMes.map(j => {
      const data = j.justificativa_data;
      // DATEONLY retorna string 'YYYY-MM-DD', não um objeto Date
      return typeof data === 'string' ? data : new Date(data).toISOString().split("T")[0];
    }));

    // Calcular horas do mês
    const toleranciaHoras = TOLERANCIA_MINUTOS / 60;
    
    for (let dia = primeiroDiaCursor; dia <= ultimoDiaCursor; dia++) {
      const data = new Date(anoCursorNum, mesCursorNum - 1, dia);
      const dataStr = data.toISOString().split("T")[0];

      const batidasDoDia = batidasPorDiaMes[dataStr] || [];
      
      // Filtrar apenas batidas válidas (não recusadas e não pendentes)
      const batidasValidasDoDia = batidasDoDia.filter(
        (b) => b.status !== "recusada" && b.status !== "pendente"
      );
      
      // Verificar se é feriado
      const eFeriadoOuDomingo = await isFeriadoOuDomingo(usuario_id, data);
      const horasPrevistas = eFeriadoOuDomingo ? null : getHorasPrevistasDia(perfil, data);
      
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
      } else {
        if (horasPrevistas === null || horasPrevistas === 0) {
          // Se não há horas previstas, todas as horas trabalhadas são extras
          horasExtrasDia = horasTrabalhadasDia;
          horasNegativasDia = 0;
        } else {
          horasExtrasDia = Math.max(0, horasTrabalhadasDia - horasPrevistas);
          horasNegativasDia = Math.max(0, horasPrevistas - horasTrabalhadasDia);

          // Aplicar tolerância
          horasExtrasDia = horasExtrasDia > toleranciaHoras ? horasExtrasDia : 0;
          horasNegativasDia = horasNegativasDia > toleranciaHoras ? horasNegativasDia : 0;

          // Se é falta (sem batida em dia que deveria trabalhar)
          if (data < hoje && horasPrevistas > 0 && batidasValidasDoDia.length === 0) {
            horasNegativasDia = horasPrevistas;
          }
        }
      }

      // Verificar se é o dia atual e se deve incluir no banco de horas
      const hojeStr = hoje.toISOString().split("T")[0];
      const eDiaAtual = dataStr === hojeStr;
      
      // Se for o dia atual, só incluir no banco de horas se houver pelo menos 2 saídas válidas
      let deveIncluirNoBanco = true;
      if (eDiaAtual) {
        const saidasDoDia = batidasValidasDoDia.filter((b) => b.tipo === "saida");
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
    ...totais,
    bancoHoras: bancoHorasAcumulado,
  });
}
