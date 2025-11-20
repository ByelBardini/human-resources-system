import {
  registrarBatida,
  getPontoHoje,
  getBatidasDia,
} from "../controllers/pontoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.post("/ponto/registrar", asyncHandler(registrarBatida));
router.get("/ponto/hoje", asyncHandler(getPontoHoje));
router.get("/ponto/batidas", asyncHandler(getBatidasDia));

export default router;

