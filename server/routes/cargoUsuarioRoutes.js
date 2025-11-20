import {
  getCargosUsuarios,
  getCargoUsuario,
  postCargoUsuario,
  putCargoUsuario,
  deleteCargoUsuario,
} from "../controllers/cargoUsuarioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import verificaToken from "../middlewares/verificaToken.js";
import express from "express";

const router = express.Router();

router.use(verificaToken);

router.get("/cargos-usuarios", asyncHandler(getCargosUsuarios));
router.get("/cargos-usuarios/:id", asyncHandler(getCargoUsuario));
router.post("/cargos-usuarios", asyncHandler(postCargoUsuario));
router.put("/cargos-usuarios/:id", asyncHandler(putCargoUsuario));
router.delete("/cargos-usuarios/:id", asyncHandler(deleteCargoUsuario));

export default router;

