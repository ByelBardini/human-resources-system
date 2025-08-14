import { Empresa } from "../models/index.js";

export async function getEmpresas(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  try {
    const empresas = await Empresa.findAll();

    return res.status(200).json(empresas);
  } catch (err) {
    console.error("Erro ao buscar empresas:", err);
    return res
      .status(500)
      .json({
        error: "Erro ao buscar empresas, fale com um administrador do sistema",
      });
  }
}
