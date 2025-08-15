import { getEmpresas, getEmpresaImagem } from "./../controllers/empresaController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get("/empresas", verificaToken, getEmpresas);
router.get("/empresas/:id/imagem", verificaToken, getEmpresaImagem);

export default router;
