import {
  getRelatorioMensal,
  getTotaisMensais,
} from "../controllers/relatorioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/relatorio/mensal", asyncHandler(getRelatorioMensal));
router.get("/relatorio/totais", asyncHandler(getTotaisMensais));

export default router;

