import { Empresa } from "../models/index.js";

export async function getEmpresas(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const empresas = await Empresa.findAll({
      attributes: ["empresa_id", "empresa_nome", "empresa_cnpj", "empresa_cor"],
    });

    return res.status(200).json(empresas);
  } catch (err) {
    console.error("Erro ao buscar empresas:", err);
    return res.status(500).json({
      error: "Erro ao buscar empresas, fale com um administrador do sistema",
    });
  }
}

export async function getEmpresaImagem(req, res) {
  const { usuario_id } = req.session.user;
  const { id } = req.params;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }
  if (!id) {
    return res
      .status(400)
      .json({ error: "Necessário informar o ID da empresa." });
  }

  try {
    const empresa = await Empresa.findByPk(id, {
      attributes: ["empresa_imagem"],
    });

    const imagemFormatada = empresa.empresa_imagem
      ? `data:image/png;base64,${empresa.empresa_imagem.toString("utf8")}`
      : null;

    return res.status(200).json(imagemFormatada);
  } catch (err) {
    console.error("Erro ao buscar empresa:", err);
    return res.status(500).json({
      error: "Erro ao buscar empresa, fale com um administrador do sistema",
    });
  }
}
