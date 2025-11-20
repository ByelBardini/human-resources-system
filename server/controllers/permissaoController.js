import { Permissao, CargoUsuario } from "../models/index.js";
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
      order: [["permissao_nome", "ASC"]],
    });

    return res.status(200).json(permissoes);
  } catch (err) {
    console.error("Erro ao buscar permissões:", err);
    throw ApiError.internal("Erro ao buscar permissões");
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

