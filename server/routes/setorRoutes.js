import {
  getSetoresPorEmpresa,
} from "../controllers/setorController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { checarLogado } from "../middlewares/checarLogado.js";

const router = express.Router();

router.use(verificaToken);
router.use(checarLogado);

router.get("/setor/:id", asyncHandler(getSetoresPorEmpresa));

export default router;
