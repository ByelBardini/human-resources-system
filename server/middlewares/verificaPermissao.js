import { ApiError } from "./ApiError.js";
import { Usuario, CargoUsuario, Permissao, Empresa } from "../models/index.js";

/**
 * Middleware para verificar se o usuário tem uma permissão específica
 * @param {string} codigoPermissao - Código da permissão a ser verificada
 */
export function verificaPermissao(codigoPermissao) {
  return async (req, res, next) => {
    try {
      const usuario_id = req.user?.usuario_id;

      if (!usuario_id) {
        throw ApiError.unauthorized("Usuário não autenticado.");
      }

      // Buscar usuário com cargo, permissões e empresas vinculadas
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
              {
                model: Empresa,
                as: "empresas",
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

      // Adicionar informações do cargo, permissões e empresas ao req.user
      req.user.cargo = {
        cargo_usuario_id: usuario.cargo.cargo_usuario_id,
        cargo_usuario_nome: usuario.cargo.cargo_usuario_nome,
      };
      req.user.permissoes = usuario.cargo.permissoes.map(
        (p) => p.permissao_codigo
      );
      req.user.empresas = usuario.cargo.empresas?.map(
        (e) => e.empresa_id
      ) || [];

      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Erro ao verificar permissão:", err);
      throw ApiError.internal("Erro ao verificar permissão");
    }
  };
}

/**
 * Middleware para verificar se o usuário tem permissão para acessar uma empresa específica
 * @param {string} codigoPermissao - Código da permissão a ser verificada
 * @param {string} empresaIdParam - Nome do parâmetro que contém o ID da empresa (default: 'empresa_id')
 */
export function verificaPermissaoEmpresa(codigoPermissao, empresaIdParam = 'empresa_id') {
  return async (req, res, next) => {
    try {
      const usuario_id = req.user?.usuario_id;

      if (!usuario_id) {
        throw ApiError.unauthorized("Usuário não autenticado.");
      }

      // Buscar usuário com cargo, permissões e empresas vinculadas
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
              {
                model: Empresa,
                as: "empresas",
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

      // Obter ID da empresa do request (params, body ou query)
      const empresa_id = parseInt(
        req.params[empresaIdParam] || 
        req.body[empresaIdParam] || 
        req.query[empresaIdParam] ||
        req.params.id ||  // fallback para rotas que usam :id
        req.body.funcionario_empresa_id  // fallback para criação de funcionário
      );

      // Verificar se o usuário tem acesso à empresa
      const empresasVinculadas = usuario.cargo.empresas?.map(e => e.empresa_id) || [];
      
      if (empresa_id && empresasVinculadas.length > 0 && !empresasVinculadas.includes(empresa_id)) {
        throw ApiError.forbidden(
          `Você não tem permissão para acessar dados desta empresa.`
        );
      }

      // Adicionar informações do cargo, permissões e empresas ao req.user
      req.user.cargo = {
        cargo_usuario_id: usuario.cargo.cargo_usuario_id,
        cargo_usuario_nome: usuario.cargo.cargo_usuario_nome,
      };
      req.user.permissoes = usuario.cargo.permissoes.map(
        (p) => p.permissao_codigo
      );
      req.user.empresas = empresasVinculadas;

      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Erro ao verificar permissão:", err);
      throw ApiError.internal("Erro ao verificar permissão");
    }
  };
}

/**
 * Função auxiliar para verificar acesso à empresa dentro de um controller
 * @param {object} req - Request object
 * @param {number} empresa_id - ID da empresa a ser verificada
 * @returns {boolean} - true se tem acesso, false caso contrário
 */
export function temAcessoEmpresa(req, empresa_id) {
  const empresasVinculadas = req.user?.empresas || [];
  // Se não há empresas vinculadas ao cargo, tem acesso a todas
  if (empresasVinculadas.length === 0) return true;
  return empresasVinculadas.includes(empresa_id);
}

/**
 * Retorna as empresas que o usuário tem acesso
 * @param {object} req - Request object
 * @returns {number[]} - Array de IDs das empresas ou array vazio (todas)
 */
export function getEmpresasAcesso(req) {
  return req.user?.empresas || [];
}

export default verificaPermissao;
