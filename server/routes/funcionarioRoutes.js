import {
  getFuncionarios,
  putFuncionario,
  postFuncionario,
  inativaFuncionario,
  getCargoSetor,
} from "./../controllers/funcionarioController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/funcionario/cargo/:id", verificaToken, getCargoSetor);
router.get("/funcionario/:id", verificaToken, getFuncionarios);
router.put("/funcionario/:id", verificaToken, putFuncionario);
router.post(
  "/funcionario",
  upload.single("foto"),
  verificaToken,
  postFuncionario
);
router.put("/funcionario/inativa/:id", verificaToken, inativaFuncionario);

export default router;
