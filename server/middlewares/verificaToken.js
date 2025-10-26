import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";
dotenv.config();

const CHAVE = process.env.SECRET_KEY_LOGIN;

export function verificaToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("Token não fornecido.");
  }

  jwt.verify(token, CHAVE, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Token expirado.");
      } else if (err.name === "JsonWebTokenError") {
        console.log("Token JWT inválido.");
      } else {
        console.error("Erro ao verificar token:", err);
      }
      throw ApiError.unauthorized("Token inválido ou expirado.");
    }

    req.user = decoded;
    next();
  });
}

export default verificaToken;
