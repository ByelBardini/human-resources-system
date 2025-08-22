import {
  getFuncionarios,
  getFuncionarioFull,
  putFuncionario,
  postFuncionario,
  inativaFuncionario,
  getCargoSetor,
} from "./../controllers/funcionarioController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadFotoFuncionario from "../middlewares/uploadFotoFuncionario.js";

const router = express.Router();

router.get("/funcionario/cargo/:id", verificaToken, getCargoSetor);
router.get("/funcionario/:id", verificaToken, getFuncionarios);
router.get("/funcionario/full/:id", verificaToken, getFuncionarioFull);
router.put("/funcionario/:id", verificaToken, putFuncionario);
router.post(
  "/funcionario",
  uploadFotoFuncionario.single("foto"),
  verificaToken,
  postFuncionario
);
router.put("/funcionario/inativa/:id", verificaToken, inativaFuncionario);

export default router;
