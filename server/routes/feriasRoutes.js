import {
  getFerias,
  criarFerias,
  atualizarFerias,
  cancelarFerias,
  getUsuariosFerias,
} from "../controllers/feriasController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/ferias", asyncHandler(getFerias));
router.get("/ferias/usuarios", asyncHandler(getUsuariosFerias));
router.post("/ferias", asyncHandler(criarFerias));
router.put("/ferias/:id", asyncHandler(atualizarFerias));
router.delete("/ferias/:id", asyncHandler(cancelarFerias));

export default router;
