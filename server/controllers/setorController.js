import { Setor } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";

export async function getSetoresPorEmpresa(req, res) {
  const id = req.params.id;
  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  const setores = await Setor.findAll({
    where: { setor_empresa_id: id },
  });

  return res.status(200).json(setores);
}