import {
  getUsuarios,
  registrarUsuario,
  resetaSenhaUsuario,
  trocaSenhaUsuario,
  inativaUsuario,
} from "../controllers/usuarioController.js";
import verificaToken from "../middlewares/verificaToken.js";
import express from "express";

const router = express.Router();

router.get("/usuario", verificaToken, getUsuarios);
router.post("/usuario", verificaToken, registrarUsuario);
router.put("/usuario/trocasenha", verificaToken, trocaSenhaUsuario);
router.put("/usuario/resetasenha/:id", resetaSenhaUsuario);
router.put("/usuario/inativa/:id", verificaToken, inativaUsuario);

export default router;
