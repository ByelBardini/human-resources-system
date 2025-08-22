import { Notificacao } from "../models/index.js";
import { Op } from "sequelize";

const toBool = (v) => v === true || v === "true" || v === "1";

const formatarData = (s) => {
  if (s == null) return null;
  const str = String(s).trim();
  if (!str) return null;
  const d = new Date(str.includes("T") ? str : `${str}T00:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
};

const formatarMySQL = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

function adicionaDiasSuspensao(notificacao_data) {
  const d = formatarData(notificacao_data);
  if (!d) return null;
  d.setDate(d.getDate() + 2);
  return formatarMySQL(d);
}

export async function getNotificacoes(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Necessário id do usuário" });
  }
  const mesAtual = new Date();
  const comecoDoMes = new Date(
    mesAtual.getFullYear(),
    mesAtual.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const comecoProximoMes = new Date(
    mesAtual.getFullYear(),
    mesAtual.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  const formatar = (d) => d.toISOString().slice(0, 10);

  try {
    const [faltas, atestados, advertencias, suspensoes] = await Promise.all([
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["falta", "meia-falta"] },
          notificacao_data: {
            [Op.gte]: formatar(comecoDoMes),
            [Op.lt]: formatar(comecoProximoMes),
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["atestado"] },
          notificacao_data: {
            [Op.gte]: formatar(comecoDoMes),
            [Op.lt]: formatar(comecoProximoMes),
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["advertencia"] },
          notificacao_data: {
            [Op.gte]: formatar(comecoDoMes),
            [Op.lt]: formatar(comecoProximoMes),
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["suspensao"] },
          notificacao_data: {
            [Op.gte]: formatar(comecoDoMes),
            [Op.lt]: formatar(comecoProximoMes),
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
    ]);

    res.status(200).json({ faltas, atestados, advertencias, suspensoes });
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return res.status(500).json({
      error:
        "Erro ao buscar notificações, fale com um administrador do sistema",
    });
  }
}

export async function getNotificacoesPorMes(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Necessário id do usuário" });
  }

  const { data_inicial, data_final } = req.query;
  if (!data_final || !data_inicial) {
    return res
      .status(400)
      .json({ error: "necessário data inicial e final da pesquisa" });
  }

  try {
    const [faltas, atestados, advertencias, suspensoes] = await Promise.all([
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["falta", "meia-falta"] },
          notificacao_data: {
            [Op.gte]: data_inicial,
            [Op.lt]: data_final,
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["atestado"] },
          notificacao_data: {
            [Op.gte]: data_inicial,
            [Op.lt]: data_final,
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["advertencia"] },
          notificacao_data: {
            [Op.gte]: data_inicial,
            [Op.lt]: data_final,
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
      Notificacao.findAll({
        where: {
          notificacao_funcionario_id: id,
          notificacao_tipo: { [Op.in]: ["suspensao"] },
          notificacao_data: {
            [Op.gte]: data_inicial,
            [Op.lt]: data_final,
          },
        },
        order: [["notificacao_data", "DESC"]],
      }),
    ]);

    res.status(200).json({ faltas, atestados, advertencias, suspensoes });
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return res.status(500).json({
      error:
        "Erro ao buscar notificações, fale com um administrador do sistema",
    });
  }
}

export async function postNotificacao(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }
  const { id } = req.params;

  if (!id) {
    return res.status(401).json({ error: "Necessário id do funcionário!" });
  }

  let {
    notificacao_tipo,
    notificacao_data,
    notificacao_descricao = null,
    notificacao_data_final = null,
    notificacao_emitir_advertencia = false,
    notificacao_emitir_suspensao = false,
  } = req.body;
  if (!notificacao_tipo || !notificacao_data) {
    return res.status(401).json({ error: "Tipo e data são obrigatórios!" });
  }

  const emitirAdvertencia = toBool(notificacao_emitir_advertencia);
  const emitirSuspensao = toBool(notificacao_emitir_suspensao);

  const ini = formatarData(notificacao_data);
  if (!ini) return res.status(400).json({ error: "Data inválida." });
  const dataIniMySQL = formatarMySQL(ini);

  const usaFim = ["atestado", "suspensao"].includes(notificacao_tipo);
  const fimParsed = formatarData(notificacao_data_final);
  const dataFimMySQL = usaFim && fimParsed ? formatarMySQL(fimParsed) : null;

  const arquivoPath = req.file
    ? `/uploads/notificacoes/${req.file.filename}`
    : null;

  try {
    if (emitirAdvertencia || emitirSuspensao) {
      const base = {
        notificacao_funcionario_id: id,
        notificacao_tipo,
        notificacao_data: dataIniMySQL,
        notificacao_descricao,
        notificacao_data_final: dataFimMySQL,
        notificacao_imagem_caminho: arquivoPath,
      };

      const extra = emitirAdvertencia
        ? {
            notificacao_funcionario_id: id,
            notificacao_tipo: "advertencia",
            notificacao_data: dataIniMySQL,
            notificacao_descricao,
            notificacao_data_final: null,
            notificacao_imagem_caminho: arquivoPath,
          }
        : {
            notificacao_funcionario_id: id,
            notificacao_tipo: "suspensao",
            notificacao_data: dataIniMySQL,
            notificacao_descricao,
            notificacao_data_final: adicionaDiasSuspensao(notificacao_data),
            notificacao_imagem_caminho: arquivoPath,
          };

      await Notificacao.bulkCreate([base, extra]);
      return res
        .status(201)
        .json({ message: "Notificações criadas com sucesso!" });
    }
    await Notificacao.create({
      notificacao_funcionario_id: id,
      notificacao_tipo,
      notificacao_data: dataIniMySQL,
      notificacao_descricao,
      notificacao_data_final: dataFimMySQL,
      notificacao_imagem_caminho: arquivoPath,
    });

    return res.status(201).json({ message: "Notificação criada com sucesso!" });
  } catch (err) {
    console.error("Erro ao gerar notificação:", err);
    return res.status(500).json({
      error: "Erro ao gerar notificação, fale com um administrador do sistema",
    });
  }
}
