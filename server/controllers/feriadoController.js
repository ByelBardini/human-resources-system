import { Feriado, Empresa, Usuario } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";
import { Op, Sequelize } from "sequelize";

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

// Listar feriados (todos os feriados de tipo empresa)
export async function getFeriados(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  // Buscar todos os feriados de tipo empresa
  const feriadosTodos = await Feriado.findAll({
    where: {
      feriado_tipo: "empresa",
      feriado_ativo: 1,
    },
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
    ],
    order: [["feriado_data", "ASC"]],
  });

  // Agrupar feriados por nome + data (mesmo dia/mês, independente do ano para repetir_ano=1)
  const grupos = new Map();

  for (const feriado of feriadosTodos) {
    // Extrair apenas mês e dia da data para agrupar feriados repetidos
    const dataObj = new Date(feriado.feriado_data + "T00:00:00");
    const mes = dataObj.getMonth() + 1;
    const dia = dataObj.getDate();
    
    // Para feriados com repetir_ano, usar apenas mês-dia como chave
    // Para outros, usar data completa
    const chaveAgrupamento = feriado.feriado_repetir_ano === 1
      ? `${feriado.feriado_nome}_${mes}-${dia}`
      : `${feriado.feriado_nome}_${feriado.feriado_data}`;

    if (!grupos.has(chaveAgrupamento)) {
      grupos.set(chaveAgrupamento, {
        feriado_id: feriado.feriado_id,
        feriado_nome: feriado.feriado_nome,
        feriado_data: feriado.feriado_data,
        feriado_repetir_ano: feriado.feriado_repetir_ano,
        empresas: [],
      });
    }

    const grupo = grupos.get(chaveAgrupamento);
    
    // Adicionar empresa se não estiver na lista
    if (feriado.empresa) {
      const empresaJaExiste = grupo.empresas.some(
        (e) => e.empresa_id === feriado.empresa.empresa_id
      );
      if (!empresaJaExiste) {
        grupo.empresas.push({
          empresa_id: feriado.empresa.empresa_id,
          empresa_nome: feriado.empresa.empresa_nome,
        });
      }
    }
  }

  // Converter map para array e ordenar por data
  const feriados = Array.from(grupos.values()).sort((a, b) => {
    return a.feriado_data.localeCompare(b.feriado_data);
  });

  return res.status(200).json({ feriados });
}

// Listar apenas feriados nacionais
export async function getFeriadosNacionais(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  const feriados = await Feriado.findAll({
    where: {
      feriado_tipo: "nacional",
      feriado_ativo: 1,
    },
    order: [["feriado_data", "ASC"]],
  });

  return res.status(200).json({ feriados });
}

// Listar feriados de uma empresa específica
export async function getFeriadosEmpresa(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  const { empresa_id } = req.params;

  if (!empresa_id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  // Verificar se a empresa existe
  const empresa = await Empresa.findByPk(empresa_id);
  if (!empresa) {
    throw ApiError.notFound("Empresa não encontrada");
  }

  const feriados = await Feriado.findAll({
    where: {
      feriado_tipo: "empresa",
      feriado_empresa_id: empresa_id,
      feriado_ativo: 1,
    },
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
    ],
    order: [["feriado_data", "ASC"]],
  });

  return res.status(200).json({ feriados });
}

// Função auxiliar para criar data no mesmo dia/mês de outro ano
function criarDataAno(dataStr, ano) {
  const [anoOriginal, mes, dia] = dataStr.split("-").map(Number);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Criar feriado
export async function criarFeriado(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  const { feriado_data, feriado_nome, feriado_repetir_ano, feriado_empresas_ids } = req.body;

  if (!feriado_data || !feriado_nome || !feriado_empresas_ids || !Array.isArray(feriado_empresas_ids) || feriado_empresas_ids.length === 0) {
    throw ApiError.badRequest("Data, nome e pelo menos uma empresa são obrigatórios");
  }

  // Verificar se todas as empresas existem e estão ativas
  const empresas = await Empresa.findAll({
    where: {
      empresa_id: feriado_empresas_ids,
      empresa_ativo: 1,
    },
  });

  if (empresas.length !== feriado_empresas_ids.length) {
    throw ApiError.badRequest("Uma ou mais empresas não foram encontradas ou estão inativas");
  }

  const repetirAno = feriado_repetir_ano === true || feriado_repetir_ano === 1;

  // Extrair ano, mês e dia da data fornecida
  const [anoOriginal, mes, dia] = feriado_data.split("-").map(Number);
  const anosParaCriar = repetirAno
    ? Array.from({ length: 10 }, (_, i) => anoOriginal + i)
    : [anoOriginal];

  const feriadosCriados = [];

  // Criar feriado para cada empresa e cada ano
  for (const empresa_id of feriado_empresas_ids) {
    for (const ano of anosParaCriar) {
      const dataFeriado = criarDataAno(feriado_data, ano);

      // Verificar se já existe feriado na mesma data para esta empresa
      const feriadoExistente = await Feriado.findOne({
        where: {
          feriado_data: dataFeriado,
          feriado_tipo: "empresa",
          feriado_empresa_id: empresa_id,
          feriado_ativo: 1,
        },
      });

      if (feriadoExistente) {
        continue; // Pular se já existe
      }

      const novoFeriado = await Feriado.create({
        feriado_data: dataFeriado,
        feriado_nome,
        feriado_tipo: "empresa",
        feriado_empresa_id: empresa_id,
        feriado_repetir_ano: repetirAno ? 1 : 0,
        feriado_ativo: 1,
      });

      feriadosCriados.push(novoFeriado);
    }
  }

  if (feriadosCriados.length === 0) {
    throw ApiError.badRequest("Feriado já existe para todas as empresas e anos solicitados");
  }

  // Buscar o primeiro feriado criado com relacionamentos
  const feriadoCompleto = await Feriado.findByPk(feriadosCriados[0].feriado_id, {
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
    ],
  });

  return res.status(201).json({
    feriado: feriadoCompleto,
    quantidadeCriada: feriadosCriados.length,
    mensagem: repetirAno
      ? `Feriado criado para ${feriadosCriados.length} registro(s) em ${feriado_empresas_ids.length} empresa(s)`
      : `Feriado criado para ${feriadosCriados.length} empresa(s)`,
  });
}

// Atualizar feriado
export async function atualizarFeriado(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  const usuario_id = getUsuarioId(req);
  const { id } = req.params;
  const { feriado_data, feriado_nome, feriado_repetir_ano } = req.body;

  if (!id) {
    throw ApiError.badRequest("Necessário ID do feriado");
  }

  const feriado = await Feriado.findByPk(id);
  if (!feriado) {
    throw ApiError.notFound("Feriado não encontrado");
  }

  // Verificar se o feriado pertence à empresa do usuário
  const usuario = await Usuario.findByPk(usuario_id, {
    attributes: ["usuario_empresa_id"],
  });

  const empresa_id = usuario?.usuario_empresa_id || null;

  if (feriado.feriado_empresa_id !== empresa_id) {
    throw ApiError.forbidden("Você não tem permissão para editar este feriado");
  }

  // Verificar se já existe outro feriado na mesma data para esta empresa
  const dataFinal = feriado_data || feriado.feriado_data;
  if (dataFinal !== feriado.feriado_data) {
    const feriadoExistente = await Feriado.findOne({
      where: {
        feriado_data: dataFinal,
        feriado_tipo: "empresa",
        feriado_empresa_id: empresa_id,
        feriado_ativo: 1,
        feriado_id: {
          [Op.ne]: id,
        },
      },
    });

    if (feriadoExistente) {
      throw ApiError.badRequest(`Já existe outro feriado desta empresa na data ${dataFinal}`);
    }
  }

  await feriado.update({
    feriado_data: feriado_data || feriado.feriado_data,
    feriado_nome: feriado_nome || feriado.feriado_nome,
    feriado_repetir_ano: feriado_repetir_ano !== undefined ? (feriado_repetir_ano ? 1 : 0) : feriado.feriado_repetir_ano,
  });

  // Se marcou para repetir pela primeira vez, criar para os próximos anos
  const repetirAnoFinal = feriado_repetir_ano !== undefined ? (feriado_repetir_ano ? 1 : 0) : feriado.feriado_repetir_ano;
  const estavaRepetindo = feriado.feriado_repetir_ano === 1;
  
  if (repetirAnoFinal === 1 && !estavaRepetindo) {
    const dataAtual = feriado_data || feriado.feriado_data;
    const [anoOriginal, mes, dia] = dataAtual.split("-").map(Number);

    // Criar para os próximos 10 anos a partir do próximo ano
    for (let i = 1; i <= 10; i++) {
      const ano = anoOriginal + i;
      const dataFeriado = criarDataAno(dataAtual, ano);

      const feriadoExistente = await Feriado.findOne({
        where: {
          feriado_data: dataFeriado,
          feriado_tipo: "empresa",
          feriado_empresa_id: empresa_id,
          feriado_ativo: 1,
        },
      });

      if (!feriadoExistente) {
        await Feriado.create({
          feriado_data: dataFeriado,
          feriado_nome: feriado_nome || feriado.feriado_nome,
          feriado_tipo: "empresa",
          feriado_empresa_id: empresa_id,
          feriado_repetir_ano: 1,
          feriado_ativo: 1,
        });
      }
    }
  }

  // Buscar atualizado com relacionamentos
  const feriadoAtualizado = await Feriado.findByPk(id, {
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["empresa_id", "empresa_nome"],
      },
    ],
  });

  return res.status(200).json({ feriado: feriadoAtualizado });
}

// Excluir feriado (soft delete) - exclui todo o grupo (todos os anos/empresas do mesmo feriado)
export async function excluirFeriado(req, res) {
  requirePermissao(req, "sistema.gerenciar_feriados");

  const { id } = req.params;

  if (!id) {
    throw ApiError.badRequest("Necessário ID do feriado");
  }

  const feriado = await Feriado.findByPk(id);
  if (!feriado) {
    throw ApiError.notFound("Feriado não encontrado");
  }

  // Construir where para encontrar todos os registros do mesmo grupo
  // (mesmo nome + mesma data ou mesmo mês-dia quando repetir_ano)
  const whereBase = {
    feriado_tipo: "empresa",
    feriado_nome: feriado.feriado_nome,
    feriado_repetir_ano: feriado.feriado_repetir_ano,
    feriado_ativo: 1,
  };

  let whereClause;
  if (feriado.feriado_repetir_ano === 1) {
    const [ano, mes, dia] = feriado.feriado_data.split("-");
    const mesDia = `${mes}-${dia}`;
    whereClause = {
      ...whereBase,
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("DATE_FORMAT", Sequelize.col("feriado_data"), "%m-%d"),
          mesDia
        ),
      ],
    };
  } else {
    whereClause = {
      ...whereBase,
      feriado_data: feriado.feriado_data,
    };
  }

  const [quantidade] = await Feriado.update(
    { feriado_ativo: 0 },
    { where: whereClause }
  );

  return res.status(200).json({
    message: "Feriado excluído com sucesso",
    registrosExcluidos: quantidade,
  });
}
