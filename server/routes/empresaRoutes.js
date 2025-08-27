import {
  getEmpresas,
  getEmpresaImagem,
} from "./../controllers/empresaController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { checarLogado } from "../middlewares/checarLogado.js";

const router = express.Router();

router.use(verificaToken);
router.use(checarLogado);

router.get("/empresas", asyncHandler(getEmpresas));
router.get("/empresas/:id/imagem", asyncHandler(getEmpresaImagem));

export default router;
