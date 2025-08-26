import {
  getSetoresPorEmpresa,
  postSetor,
  putSetor,
  deleteSetor,
} from "../controllers/setorController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { checarLogado } from "../middlewares/chegarLogado.js";

const router = express.Router();

router.use(verificaToken);
router.use(checarLogado);

router.get("/setor/:id", asyncHandler(getSetoresPorEmpresa));
router.post("/setor", asyncHandler(postSetor));
router.put("/setor/:id", asyncHandler(putSetor));
router.delete("/setor/:id", asyncHandler(deleteSetor));

export default router;
