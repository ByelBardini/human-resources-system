import { ApiError } from "./ApiError.js";
import { Usuario, CargoUsuario, Permissao } from "../models/index.js";

export function verificaPermissao(codigoPermissao) {
  return async (req, res, next) => {
    try {
      const usuario_id = req.user?.usuario_id;

      if (!usuario_id) {
        throw ApiError.unauthorized("Usuário não autenticado.");
      }

      // Buscar usuário com cargo e permissões
      const usuario = await Usuario.findByPk(usuario_id, {
        include: [
          {
            model: CargoUsuario,
            as: "cargo",
            include: [
              {
                model: Permissao,
                as: "permissoes",
              },
            ],
          },
        ],
      });

      if (!usuario || !usuario.cargo) {
        throw ApiError.forbidden("Usuário sem cargo atribuído.");
      }

      // Verificar se o cargo está ativo
      if (usuario.cargo.cargo_usuario_ativo === 0) {
        throw ApiError.forbidden("Cargo do usuário está inativo.");
      }

      // Verificar se o usuário tem a permissão necessária
      const temPermissao = usuario.cargo.permissoes.some(
        (permissao) => permissao.permissao_codigo === codigoPermissao
      );

      if (!temPermissao) {
        throw ApiError.forbidden(
          `Você não tem permissão para realizar esta ação. Permissão necessária: ${codigoPermissao}`
        );
      }

      // Adicionar informações do cargo e permissões ao req.user
      req.user.cargo = {
        cargo_usuario_id: usuario.cargo.cargo_usuario_id,
        cargo_usuario_nome: usuario.cargo.cargo_usuario_nome,
      };
      req.user.permissoes = usuario.cargo.permissoes.map(
        (p) => p.permissao_codigo
      );

      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Erro ao verificar permissão:", err);
      throw ApiError.internal("Erro ao verificar permissão");
    }
  };
}

export default verificaPermissao;

