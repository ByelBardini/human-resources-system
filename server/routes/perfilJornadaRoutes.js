import {
  criarPerfilJornada,
  listarPerfisJornada,
  vincularFuncionarioPerfil,
  listarPerfisJornadaPublico,
} from "../controllers/perfilJornadaController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.post("/perfil-jornada", asyncHandler(criarPerfilJornada));
router.get("/perfil-jornada", asyncHandler(listarPerfisJornada));
router.get("/perfil-jornada/publico", asyncHandler(listarPerfisJornadaPublico));
router.post("/perfil-jornada/vincular", asyncHandler(vincularFuncionarioPerfil));

export default router;

