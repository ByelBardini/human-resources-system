import {
  getUsuarios,
  registrarUsuario,
  resetaSenhaUsuario,
  trocaSenhaUsuario,
  inativaUsuario,
  atualizarCargoUsuario,
} from "../controllers/usuarioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import verificaToken from "../middlewares/verificaToken.js";
import express from "express";

const router = express.Router();

router.get("/usuario", verificaToken, asyncHandler(getUsuarios));
router.post("/usuario", verificaToken, asyncHandler(registrarUsuario));
router.put(
  "/usuario/trocasenha",
  verificaToken,
  asyncHandler(trocaSenhaUsuario)
);
router.put(
  "/usuario/resetasenha/:id",
  verificaToken,
  asyncHandler(resetaSenhaUsuario)
);
router.put("/usuario/inativa/:id", verificaToken, asyncHandler(inativaUsuario));
router.put("/usuario/cargo/:id", verificaToken, asyncHandler(atualizarCargoUsuario));

export default router;
