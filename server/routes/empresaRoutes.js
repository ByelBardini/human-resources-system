import {
  getEmpresas,
  getEmpresaImagem,
} from "./../controllers/empresaController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/empresas", asyncHandler(getEmpresas));
router.get("/empresas/:id/imagem", asyncHandler(getEmpresaImagem));

export default router;
