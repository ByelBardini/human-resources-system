import { Permissao, CargoUsuario, CategoriaPermissao } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";

function requireUser(req) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized(
      "Necessário estar logado para realizar operações."
    );
  }
  return usuario;
}

// Listar todas as permissões
export async function getPermissoes(req, res) {
  requireUser(req);

  try {
    const permissoes = await Permissao.findAll({
      include: [
        {
          model: CategoriaPermissao,
          as: "categoria",
          attributes: ["categoria_id", "categoria_codigo", "categoria_nome", "categoria_ordem"],
        },
      ],
      order: [
        [{ model: CategoriaPermissao, as: "categoria" }, "categoria_ordem", "ASC"],
        ["permissao_nome", "ASC"],
      ],
    });

    return res.status(200).json(permissoes);
  } catch (err) {
    console.error("Erro ao buscar permissões:", err);
    throw ApiError.internal("Erro ao buscar permissões");
  }
}

// Listar permissões agrupadas por categoria
export async function getPermissoesAgrupadas(req, res) {
  requireUser(req);

  try {
    const categorias = await CategoriaPermissao.findAll({
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["permissao_id", "permissao_codigo", "permissao_nome", "permissao_descricao"],
        },
      ],
      order: [
        ["categoria_ordem", "ASC"],
        [{ model: Permissao, as: "permissoes" }, "permissao_nome", "ASC"],
      ],
    });

    return res.status(200).json(categorias);
  } catch (err) {
    console.error("Erro ao buscar permissões agrupadas:", err);
    throw ApiError.internal("Erro ao buscar permissões agrupadas");
  }
}

// Obter uma permissão específica
export async function getPermissao(req, res) {
  requireUser(req);
  const { id } = req.params;

  try {
    const permissao = await Permissao.findByPk(id, {
      include: [
        {
          model: CargoUsuario,
          as: "cargos",
          attributes: ["cargo_usuario_id", "cargo_usuario_nome"],
        },
        {
          model: CategoriaPermissao,
          as: "categoria",
          attributes: ["categoria_id", "categoria_codigo", "categoria_nome"],
        },
      ],
    });

    if (!permissao) {
      throw ApiError.notFound("Permissão não encontrada");
    }

    return res.status(200).json(permissao);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar permissão:", err);
    throw ApiError.internal("Erro ao buscar permissão");
  }
}

// Obter permissões de um cargo específico
export async function getPermissoesCargo(req, res) {
  requireUser(req);
  const { cargoId } = req.params;

  try {
    const cargo = await CargoUsuario.findByPk(cargoId, {
      include: [
        {
          model: Permissao,
          as: "permissoes",
          include: [
            {
              model: CategoriaPermissao,
              as: "categoria",
              attributes: ["categoria_id", "categoria_codigo", "categoria_nome", "categoria_ordem"],
            },
          ],
        },
      ],
    });

    if (!cargo) {
      throw ApiError.notFound("Cargo não encontrado");
    }

    return res.status(200).json(cargo.permissoes);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("Erro ao buscar permissões do cargo:", err);
    throw ApiError.internal("Erro ao buscar permissões do cargo");
  }
}
