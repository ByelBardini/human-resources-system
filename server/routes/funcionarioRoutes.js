import {
  getFuncionarios,
  getFuncionariosInativos,
  getFuncionarioFull,
  getFuncionariosComUsuario,
  putFuncionario,
  postFuncionario,
  inativaFuncionario,
  getCargoSetor,
} from "./../controllers/funcionarioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadFotoFuncionario from "../middlewares/uploadFotoFuncionario.js";

const router = express.Router();

router.use(verificaToken);

router.get("/funcionario/cargo/:id", asyncHandler(getCargoSetor));
router.get("/funcionario/com-usuario", asyncHandler(getFuncionariosComUsuario));
router.get("/funcionario/:id", asyncHandler(getFuncionarios));
router.get("/funcionario/inativos/:id", asyncHandler(getFuncionariosInativos));
router.get("/funcionario/full/:id", asyncHandler(getFuncionarioFull));
router.put(
  "/funcionario/:id",
  uploadFotoFuncionario.single("foto"),
  asyncHandler(putFuncionario)
);
router.post(
  "/funcionario",
  uploadFotoFuncionario.single("foto"),
  asyncHandler(postFuncionario)
);
router.put("/funcionario/inativa/:id", asyncHandler(inativaFuncionario));

export default router;
