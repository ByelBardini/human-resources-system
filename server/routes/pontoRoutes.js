import {
  registrarBatida,
  getPontoHoje,
  getBatidasDia,
  getBancoHoras,
  adicionarBatidaManual,
  getGestaoEmpresas,
  getGestaoFuncionarios,
  getHistoricoFuncionario,
  getPendentes,
  aprovarBatida,
  reprovarBatida,
  invalidarBatida,
  fecharBancoHoras,
  recalcularBancoHoras,
  aprovarBatidasDia,
  recalcularDia,
  exportarPontoExcel,
  exportarTodosPontosZip,
  getFuncionariosDesligados,
  getHistoricoFuncionarioDesligado,
} from "../controllers/pontoController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import uploadFotoBatida from "../middlewares/uploadFotoBatida.js";

const router = express.Router();

router.use(verificaToken);

// Rotas do funcionário
router.post(
  "/ponto/registrar",
  uploadFotoBatida.single("foto"),
  asyncHandler(registrarBatida)
);
router.get("/ponto/hoje", asyncHandler(getPontoHoje));
router.get("/ponto/batidas", asyncHandler(getBatidasDia));
router.get("/ponto/banco-horas", asyncHandler(getBancoHoras));
router.post(
  "/ponto/adicionar-batida",
  uploadFotoBatida.single("foto"),
  asyncHandler(adicionarBatidaManual)
);

// Rotas de gestão (aprovadores)
router.get("/ponto/gestao/empresas", asyncHandler(getGestaoEmpresas));
router.get("/ponto/gestao/funcionarios", asyncHandler(getGestaoFuncionarios));
router.get(
  "/ponto/gestao/funcionario/:id/historico",
  asyncHandler(getHistoricoFuncionario)
);
router.get("/ponto/gestao/pendentes", asyncHandler(getPendentes));
router.put("/ponto/gestao/batida/:id/aprovar", asyncHandler(aprovarBatida));
router.put("/ponto/gestao/batida/:id/reprovar", asyncHandler(reprovarBatida));
router.put(
  "/ponto/gestao/batida/:id/invalidar",
  asyncHandler(invalidarBatida)
);
router.post(
  "/ponto/gestao/funcionario/:funcionario_id/fechar-banco",
  asyncHandler(fecharBancoHoras)
);
router.post(
  "/ponto/gestao/funcionario/:funcionario_id/recalcular-banco",
  asyncHandler(recalcularBancoHoras)
);
router.post(
  "/ponto/gestao/funcionario/:funcionario_id/aprovar-batidas-dia",
  asyncHandler(aprovarBatidasDia)
);
router.post(
  "/ponto/gestao/funcionario/:funcionario_id/recalcular-dia",
  asyncHandler(recalcularDia)
);
router.get(
  "/ponto/gestao/funcionario/:funcionario_id/exportar",
  asyncHandler(exportarPontoExcel)
);
router.get(
  "/ponto/gestao/exportar-todos",
  asyncHandler(exportarTodosPontosZip)
);
router.get(
  "/ponto/gestao/funcionarios-desligados",
  asyncHandler(getFuncionariosDesligados)
);
router.get(
  "/ponto/gestao/funcionario-desligado/:id/historico",
  asyncHandler(getHistoricoFuncionarioDesligado)
);

export default router;
