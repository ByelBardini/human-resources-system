import {
  getNotificacoes,
  postNotificacao,
} from "../controllers/notificacaoController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadArquivoNotificacao from "../middlewares/uploadArquivoNotificacao.js";

const router = express.Router();

router.get("/notificacoes/:id", verificaToken, getNotificacoes);
router.post(
  "/notificacoes/:id",
  verificaToken,
  uploadArquivoNotificacao.single("arquivo"),
  postNotificacao
);

export default router;
