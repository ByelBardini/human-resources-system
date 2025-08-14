import {
  getSetoresPorEmpresa,
  postSetor,
  putSetor,
  deleteSetor,
} from "../controllers/setorController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get("/setor/:id", verificaToken, getSetoresPorEmpresa);
router.post("/setor", verificaToken, postSetor);
router.put("/setor/:id", verificaToken, putSetor);
router.delete("/setor/:id", verificaToken, deleteSetor);

export default router;
