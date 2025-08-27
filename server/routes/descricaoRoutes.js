import {
  getDescricoes,
  putDescricao,
} from "../controllers/descricaoController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { checarLogado } from "../middlewares/checarLogado.js";

const router = express.Router();

router.use(verificaToken);
router.use(checarLogado);

router.get("/descricoes/:id", asyncHandler(getDescricoes));
router.put("/descricoes/:id", asyncHandler(putDescricao));

export default router;
