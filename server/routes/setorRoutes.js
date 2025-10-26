import { getSetoresPorEmpresa } from "../controllers/setorController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/setor/:id", asyncHandler(getSetoresPorEmpresa));

export default router;
