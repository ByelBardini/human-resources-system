import {
  getNotificacoes,
  getNotificacoesPorMes,
  postNotificacao,
} from "../controllers/notificacaoController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadArquivoNotificacao from "../middlewares/uploadArquivoNotificacao.js";

const router = express.Router();

router.get("/notificacoes/:id", verificaToken, getNotificacoes);
router.get("/notificacoes/mes/:id", verificaToken, getNotificacoesPorMes);
router.post(
  "/notificacoes/:id",
  verificaToken,
  uploadArquivoNotificacao.single("arquivo"),
  postNotificacao
);

export default router;
