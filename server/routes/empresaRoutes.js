import {
  getEmpresas,
  getTodasEmpresas,
  getEmpresaImagem,
  postEmpresa,
  putEmpresa,
  inativarEmpresa,
} from "./../controllers/empresaController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadLogoEmpresa from "../middlewares/uploadLogoEmpresa.js";

const router = express.Router();

router.use(verificaToken);

router.get("/empresas", asyncHandler(getEmpresas));
router.get("/empresas/todas", asyncHandler(getTodasEmpresas));
router.get("/empresas/:id/imagem", asyncHandler(getEmpresaImagem));
router.post(
  "/empresas",
  uploadLogoEmpresa.single("logo"),
  asyncHandler(postEmpresa)
);
router.put(
  "/empresas/:id",
  uploadLogoEmpresa.single("logo"),
  asyncHandler(putEmpresa)
);
router.put("/empresas/:id/inativar", asyncHandler(inativarEmpresa));

export default router;
