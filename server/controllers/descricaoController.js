import { Descricao, Setor, Cargo } from "../models/index.js";

export async function getDescricoes(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  const id = req.params.id;
  if (!id) {
    return res
      .status(400)
      .json({ error: "Necessário informar o ID da empresa." });
  }

  try {
    const descricoes = await Descricao.findAll({
      where: { descricao_empresa_id: id },
      attributes: [
        "descricao_id",
        "descricao_setor_id",
        "descricao_treinamento",
        "descricao_escolaridade",
        "descricao_comportamentos",
        "descricao_tecnicas",
        "descricao_experiencia",
        "descricao_responsabilidades",
      ],
      include: [
        { model: Cargo, as: "cargo", attributes: ["cargo_nome"] },
        { model: Setor, as: "setor", attributes: ["setor_nome"] },
      ],
    });

    return res.status(200).json(descricoes);
  } catch (err) {
    console.error("Erro ao buscar descrições:", err);
    return res.status(500).json({
      error: "Erro ao buscar descrições, fale com um administrador do sistema",
    });
  }
}

export async function putDescricao(req, res) {
  const { id } = req.params;
  const {
    descricao_setor_id = "",
    descricao_escolaridade = "",
    descricao_treinamento = "",
    descricao_comportamento = "",
    descricao_tecnica = "",
    descricao_experiencia = "",
    descricao_responsabilidade = "",
  } = req.body;
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (!id) {
    return res
      .status(400)
      .json({ error: "Necessário informar o ID da descrição" });
  }

  try {
    const descricao = await Descricao.findByPk(id);

    descricao.update(
      {
        descricao_setor_id:
          descricao_setor_id !== ""
            ? descricao_setor_id
            : descricao.descricao_setor_id,
        descricao_escolaridade: descricao_escolaridade,
        descricao_treinamento: descricao_treinamento,
        descricao_comportamentos: descricao_comportamento,
        descricao_tecnicas: descricao_tecnica,
        descricao_experiencia: descricao_experiencia,
        descricao_responsabilidades: descricao_responsabilidade,
      },
      {
        where: { descricao_setor_id: descricao_setor_id },
      }
    );

    return res.status(200).json({ message: "Aumento aplicado com sucesso." });
  } catch (err) {
    console.error("Erro ao editar descrição:", err);
    return res.status(500).json({
      error: "Erro ao editar descrição, fale com um administrador do sistema",
    });
  }
}
