import { Empresa } from "../models/index.js";
import { ApiError } from "../middlewares/ApiError.js";

function getUsuarioId(req) {
  return req?.user?.usuario_id ?? null;
}

function requirePermissao(req, codigoPermissao) {
  const usuario = req.user;
  if (!usuario) {
    throw ApiError.unauthorized("Necessário estar logado para realizar operações.");
  }
  const permissoes = usuario.permissoes || [];
  if (!permissoes.includes(codigoPermissao)) {
    throw ApiError.forbidden(
      `Você não tem permissão para realizar esta ação. Permissão necessária: ${codigoPermissao}`
    );
  }
  return usuario;
}

export async function getEmpresas(req, res) {
  const empresas = await Empresa.findAll({
    where: { empresa_ativo: 1 },
    attributes: ["empresa_id", "empresa_nome", "empresa_cnpj", "empresa_cor", "empresa_ativo"],
    order: [["empresa_nome", "ASC"]],
  });

  return res.status(200).json(empresas);
}

export async function getTodasEmpresas(req, res) {
  requirePermissao(req, "sistema.gerenciar_empresas");
  const empresas = await Empresa.findAll({
    attributes: ["empresa_id", "empresa_nome", "empresa_cnpj", "empresa_cor", "empresa_ativo"],
    order: [["empresa_nome", "ASC"]],
  });

  return res.status(200).json(empresas);
}

export async function getEmpresaImagem(req, res) {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest("Necessário ID do da empresa.");
  }

  const empresa = await Empresa.findByPk(id, {
    attributes: ["empresa_imagem"],
  });

  if (!empresa || !empresa.empresa_imagem) {
    return res.status(200).json(null);
  }

  // Converter o BLOB para base64 corretamente
  let imagemFormatada = null;
  
  try {
    if (empresa.empresa_imagem) {
      // Caso 1: É um Buffer (formato novo)
      if (Buffer.isBuffer(empresa.empresa_imagem)) {
        const base64 = empresa.empresa_imagem.toString("base64");
        // Detectar o tipo MIME baseado nos primeiros bytes do buffer
        let mimeType = "image/png"; // padrão
        if (empresa.empresa_imagem.length > 1) {
          if (empresa.empresa_imagem[0] === 0xFF && empresa.empresa_imagem[1] === 0xD8) {
            mimeType = "image/jpeg";
          } else if (empresa.empresa_imagem[0] === 0x89 && empresa.empresa_imagem[1] === 0x50) {
            mimeType = "image/png";
          } else if (
            empresa.empresa_imagem[0] === 0x52 && 
            empresa.empresa_imagem[1] === 0x49 && 
            empresa.empresa_imagem[2] === 0x46 && 
            empresa.empresa_imagem[3] === 0x46
          ) {
            mimeType = "image/webp";
          }
        }
        imagemFormatada = `data:${mimeType};base64,${base64}`;
      } 
      // Caso 2: É uma string
      else if (typeof empresa.empresa_imagem === "string") {
        // Se já está formatada como data URI (formato antigo que funcionava)
        if (empresa.empresa_imagem.startsWith("data:image/")) {
          imagemFormatada = empresa.empresa_imagem;
        }
        // Se é base64 puro (sem prefixo data:)
        else if (/^[A-Za-z0-9+/=]+$/.test(empresa.empresa_imagem)) {
          // Tentar detectar o tipo pela estrutura do base64
          let mimeType = "image/png";
          try {
            const buffer = Buffer.from(empresa.empresa_imagem, "base64");
            if (buffer.length > 1) {
              if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                mimeType = "image/jpeg";
              } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
                mimeType = "image/png";
              } else if (
                buffer[0] === 0x52 && 
                buffer[1] === 0x49 && 
                buffer[2] === 0x46 && 
                buffer[3] === 0x46
              ) {
                mimeType = "image/webp";
              }
            }
          } catch (e) {
            // Se falhar ao decodificar, mantém como PNG
            console.error("Erro ao decodificar base64:", e);
          }
          imagemFormatada = `data:${mimeType};base64,${empresa.empresa_imagem}`;
        }
        // Caso de string corrompida (formato antigo com toString("utf8"))
        else {
          // Tenta converter a string para Buffer e depois para base64
          try {
            const buffer = Buffer.from(empresa.empresa_imagem, "binary");
            const base64 = buffer.toString("base64");
            let mimeType = "image/png";
            if (buffer.length > 1) {
              if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                mimeType = "image/jpeg";
              } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
                mimeType = "image/png";
              } else if (
                buffer[0] === 0x52 && 
                buffer[1] === 0x49 && 
                buffer[2] === 0x46 && 
                buffer[3] === 0x46
              ) {
                mimeType = "image/webp";
              }
            }
            imagemFormatada = `data:${mimeType};base64,${base64}`;
          } catch (e) {
            console.error("Erro ao processar imagem antiga:", e);
            // Se tudo falhar, retorna null
            imagemFormatada = null;
          }
        }
      }
      // Caso 3: Outro formato (tenta converter para Buffer)
      else {
        try {
          const buffer = Buffer.from(empresa.empresa_imagem);
          const base64 = buffer.toString("base64");
          let mimeType = "image/png";
          if (buffer.length > 1) {
            if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
              mimeType = "image/jpeg";
            } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
              mimeType = "image/png";
            }
          }
          imagemFormatada = `data:${mimeType};base64,${base64}`;
        } catch (e) {
          console.error("Erro ao processar imagem:", e);
          imagemFormatada = null;
        }
      }
    }
  } catch (error) {
    console.error("Erro ao processar imagem da empresa:", error);
    imagemFormatada = null;
  }

  return res.status(200).json(imagemFormatada);
}

export async function postEmpresa(req, res) {
  requirePermissao(req, "sistema.gerenciar_empresas");
  const usuario_id = getUsuarioId(req);

  const { empresa_nome, empresa_cnpj, empresa_cor } = req.body;

  if (!empresa_nome || !empresa_cnpj || !empresa_cor) {
    throw ApiError.badRequest("Todos os dados são obrigatórios");
  }

  let empresa_imagem = null;
  if (req.file && req.file.buffer) {
    // Garantir que o buffer seja salvo corretamente como BLOB
    empresa_imagem = Buffer.from(req.file.buffer);
  }

  const novaEmpresa = await Empresa.create(
    {
      empresa_nome,
      empresa_cnpj,
      empresa_cor,
      empresa_imagem,
      empresa_ativo: 1,
    },
    {
      usuario_id: usuario_id,
    }
  );

  return res.status(201).json({
    message: "Empresa cadastrada com sucesso!",
    empresa: {
      empresa_id: novaEmpresa.empresa_id,
      empresa_nome: novaEmpresa.empresa_nome,
      empresa_cnpj: novaEmpresa.empresa_cnpj,
      empresa_cor: novaEmpresa.empresa_cor,
      empresa_ativo: novaEmpresa.empresa_ativo,
    },
  });
}

export async function putEmpresa(req, res) {
  requirePermissao(req, "sistema.gerenciar_empresas");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;
  const { empresa_nome, empresa_cnpj, empresa_cor } = req.body;

  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  if (!empresa_nome || !empresa_cnpj || !empresa_cor) {
    throw ApiError.badRequest("Todos os dados são obrigatórios");
  }

  const empresa = await Empresa.findByPk(id);
  if (!empresa) {
    throw ApiError.badRequest("Empresa não encontrada");
  }

  let empresa_imagem = empresa.empresa_imagem; // Mantém a imagem existente se não houver nova
  if (req.file && req.file.buffer) {
    // Garantir que o buffer seja salvo corretamente como BLOB
    empresa_imagem = Buffer.from(req.file.buffer);
  }

  await empresa.update(
    {
      empresa_nome,
      empresa_cnpj,
      empresa_cor,
      empresa_imagem,
    },
    {
      usuario_id: usuario_id,
    }
  );

  return res.status(200).json({ message: "Empresa alterada com sucesso!" });
}

export async function inativarEmpresa(req, res) {
  requirePermissao(req, "sistema.gerenciar_empresas");
  const usuario_id = getUsuarioId(req);

  const { id } = req.params;

  if (!id) {
    throw ApiError.badRequest("Necessário ID da empresa");
  }

  const empresa = await Empresa.findByPk(id);

  if (!empresa) {
    throw ApiError.badRequest("Empresa não encontrada");
  }

  await empresa.update(
    {
      empresa_ativo: 0,
    },
    {
      usuario_id: usuario_id,
    }
  );

  return res.status(200).json({ message: "Empresa inativada com sucesso." });
}
