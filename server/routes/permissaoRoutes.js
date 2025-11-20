import {
  getPermissoes,
  getPermissao,
  getPermissoesCargo,
} from "../controllers/permissaoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import verificaToken from "../middlewares/verificaToken.js";
import express from "express";

const router = express.Router();

router.use(verificaToken);

router.get("/permissoes", asyncHandler(getPermissoes));
router.get("/permissoes/:id", asyncHandler(getPermissao));
router.get("/permissoes/cargo/:cargoId", asyncHandler(getPermissoesCargo));

export default router;

