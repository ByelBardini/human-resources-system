import { ApiError } from './ApiError.js';

export function checarLogado(req, _res, next) {
  if (!req.session?.user) {
    throw ApiError.unauthorized('Necessário estar logado para realizar operações.');
  }
  next();
}
