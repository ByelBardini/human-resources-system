import {
  getFeriados,
  getFeriadosNacionais,
  getFeriadosEmpresa,
  criarFeriado,
  atualizarFeriado,
  excluirFeriado,
} from "../controllers/feriadoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/feriados", asyncHandler(getFeriados));
router.get("/feriados/nacionais", asyncHandler(getFeriadosNacionais));
router.get("/feriados/empresa/:empresa_id", asyncHandler(getFeriadosEmpresa));
router.post("/feriados", asyncHandler(criarFeriado));
router.put("/feriados/:id", asyncHandler(atualizarFeriado));
router.delete("/feriados/:id", asyncHandler(excluirFeriado));

export default router;
