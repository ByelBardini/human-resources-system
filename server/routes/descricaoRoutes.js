import {
  getDescricoes,
  putDescricao,
} from "../controllers/descricaoController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get("/descricoes/:id", verificaToken, getDescricoes);
router.put("/descricoes/:id", verificaToken, putDescricao);

export default router;
