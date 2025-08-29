import { Empresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";

export async function getEmpresas(req, res) {
  const empresas = await Empresa.findAll({
    attributes: ["empresa_id", "empresa_nome", "empresa_cnpj", "empresa_cor"],
    order: [["empresa_nome", "ASC"]],
  });

  return res.status(200).json(empresas);
}

export async function getEmpresaImagem(req, res) {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID do da empresa.");
  }

  const empresa = await Empresa.findByPk(id, {
    attributes: ["empresa_imagem"],
  });

  const imagemFormatada = empresa.empresa_imagem
    ? `data:image/png;base64,${empresa.empresa_imagem.toString("utf8")}`
    : null;

  return res.status(200).json(imagemFormatada);
}
