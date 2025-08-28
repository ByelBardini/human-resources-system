import {
  getNotificacoes,
  getNotificacoesPorMes,
  postNotificacao,
} from "../controllers/notificacaoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { checarLogado } from "../middlewares/checarLogado.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadArquivoNotificacao from "../middlewares/uploadArquivoNotificacao.js";

const router = express.Router();

router.use(verificaToken);
router.use(checarLogado);

router.get("/notificacoes/:id", asyncHandler(getNotificacoes));
router.get("/notificacoes/mes/:id", asyncHandler(getNotificacoesPorMes));
router.post(
  "/notificacoes/:id",
  uploadArquivoNotificacao.single("arquivo"),
  asyncHandler(postNotificacao)
);

export default router;
