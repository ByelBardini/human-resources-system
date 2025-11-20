import {
  criarJustificativa,
  listarJustificativas,
  aprovarJustificativa,
  recusarJustificativa,
} from "../controllers/justificativaController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadAnexoJustificativa from "../middlewares/uploadAnexoJustificativa.js";

const router = express.Router();

router.use(verificaToken);

router.post(
  "/justificativa",
  uploadAnexoJustificativa.single("anexo"),
  asyncHandler(criarJustificativa)
);
router.get("/justificativa", asyncHandler(listarJustificativas));
router.put("/justificativa/aprovar/:id", asyncHandler(aprovarJustificativa));
router.put("/justificativa/recusar/:id", asyncHandler(recusarJustificativa));

export default router;

