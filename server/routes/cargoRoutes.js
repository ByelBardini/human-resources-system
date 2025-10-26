import {
  getCargos,
  postCargo,
  aumentoGeral,
  deleteCargo,
} from "../controllers/cargoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/cargos/:id", asyncHandler(getCargos));
router.post("/cargos", asyncHandler(postCargo));
router.put("/cargos/aumento", asyncHandler(aumentoGeral));
router.delete("/cargos/:id", asyncHandler(deleteCargo));

export default router;
