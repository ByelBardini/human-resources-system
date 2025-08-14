import {
  getFuncionariosPorSetor,
  getFuncionarios,
  putFuncionario,
  postFuncionario,
  inativaFuncionario,
} from "./../controllers/funcionarioController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get(
  "/funcionario/:id/:setor_id",
  verificaToken,
  getFuncionariosPorSetor
);
router.get("/funcionario/:id/", verificaToken, getFuncionarios);
router.put("/funcionario/:id", verificaToken, putFuncionario);
router.post("/funcionario", verificaToken, postFuncionario);
router.put("/funcionario/inativa/:id", verificaToken, inativaFuncionario);

export default router;
