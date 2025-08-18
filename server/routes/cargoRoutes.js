import {
  getCargos,
  getCargosDescricao,
  postCargo,
  aumentoGeral,
  putCargo,
  deleteCargo,
} from "../controllers/cargoController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get("/cargos/:id", verificaToken, getCargos);
router.get("/cargos/descricao", verificaToken, getCargosDescricao);
router.post("/cargos", verificaToken, postCargo);
router.put("/cargos/aumento", verificaToken, aumentoGeral);
router.put("/cargos/:id", verificaToken, putCargo);
router.delete("/cargos/:id", verificaToken, deleteCargo);

export default router;
