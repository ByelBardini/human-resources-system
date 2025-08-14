import { getEmpresas } from "./../controllers/empresaController.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.get("/empresas", verificaToken, getEmpresas);

export default router;
