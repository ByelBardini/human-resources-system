import crypto from "crypto";
import {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError,
  DatabaseError,
} from "sequelize";
import { ApiError } from "./ApiError.js";

function mapSequelize(err) {
  if (
    err instanceof UniqueContraintError ||
    err?.parent?.code === "ERR_DUP_ENTRY"
  ) {
    return ApiError.conflict("Recurso duplicado");
  }
  if (err instanceof ForeignKeyConstraintError) {
    return ApiError.conflict("Violação de chave primária");
  }
  if (err instanceof ValidationError) {
    return ApiError.badRequest(
      "Validação do banco falhou",
      err.errors?.map((e) => ({
        path: e.path,
        message: e.message,
      }))
    );
  }
  if (err instanceof DatabaseError) {
    return ApiError.internal("Falha no banco de dados");
  }
  return null;
}

export function errorHandler(err, req, res, _next) {
  const mapeado = mapSequelize(err);
  const e = mapeado || (err instanceof ApiError ? err : ApiError.internal());

  console.error({
    mehod: req.method,
    path: req.path,
    errorName: err?.name,
    errorMessage: err?.message,
    stack: err?.stack,
  });

  return res.status(e.status).json({
    ok: false,
    code: e.code,
    message: e.message,
  })
}
