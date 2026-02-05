import {
  getRelatorioMensal,
  getTotaisMensais,
  getEmpresasRelatorios,
  getCargosRelatorio,
  getSetoresNiveisRelatorio,
  exportarFuncoes,
  exportarProjecaoSalarial,
  getCamposFuncionarios,
  exportarFuncionarios,
} from "../controllers/relatorioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";

const router = express.Router();

router.use(verificaToken);

router.get("/relatorio/mensal", asyncHandler(getRelatorioMensal));
router.get("/relatorio/totais", asyncHandler(getTotaisMensais));

router.get("/relatorio/empresas", asyncHandler(getEmpresasRelatorios));
router.get("/relatorio/cargos/:empresa_id", asyncHandler(getCargosRelatorio));
router.get("/relatorio/setores-niveis/:empresa_id", asyncHandler(getSetoresNiveisRelatorio));
router.get("/relatorio/funcoes/:empresa_id", asyncHandler(exportarFuncoes));
router.post("/relatorio/projecao-salarial", asyncHandler(exportarProjecaoSalarial));
router.get("/relatorio/funcionarios/campos", asyncHandler(getCamposFuncionarios));
router.post("/relatorio/funcionarios", asyncHandler(exportarFuncionarios));

export default router;

