import {
  getUsuarios,
  registrarUsuario,
  resetaSenhaUsuario,
  trocaSenhaUsuario,
  inativaUsuario,
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

export default router;
