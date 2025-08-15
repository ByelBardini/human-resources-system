import { Funcionario } from "../models/index.js";
import { UniqueConstraintError, ValidationError } from "sequelize";

export async function getFuncionariosPorSetor(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  const { id, setor_id } = req.params;
  if (!id || !setor_id) {
    return res
      .status(400)
      .json({ error: "Necessário id da empresa e do setor a serem buscados" });
  }

  try {
    const funcionarios = await Funcionario.findAll({
      where: { funcionario_empresa_id: id, funcionario_setor_id: setor_id },
    });

    return res.status(200).json(funcionarios);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    return res.status(500).json({
      error:
        "Erro ao buscar funcionários, fale com um administrador do sistema",
    });
  }
}

export async function getFuncionarios(req, res) {
  const { usuario_id } = req.session.user;
  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ error: "Necessário id da empresa a ser buscada" });
  }

  try {
    const funcionarios = await Funcionario.findAll({
      where: { funcionario_empresa_id: id },
    });

    return res.status(200).json(funcionarios);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    return res.status(500).json({
      error:
        "Erro ao buscar funcionários, fale com um administrador do sistema",
    });
  }
}

export async function putFuncionario(req, res) {
  const { id } = req.params;
  const {
    funcionario_setor_id,
    funcionario_nome,
    funcionario_cargo,
    funcionario_nivel,
    funcionario_cpf,
    funcionario_sexo,
    funcionario_salario,
  } = req.body;
  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (
    !funcionario_nome ||
    !funcionario_cargo ||
    !funcionario_setor_id ||
    !funcionario_nivel ||
    !funcionario_cpf ||
    !funcionario_sexo ||
    !funcionario_salario
  ) {
    return res.status(400).json({ error: "Os dados são obrigatórios" });
  }

  try {
    const funcionario = await Funcionario.findByPk(id);

    if (!funcionario) {
      return res.status(404).json({ error: "Funcionário não encontrado." });
    }

    funcionario.funcionario_nome = funcionario_nome;
    funcionario.funcionario_cargo = funcionario_cargo;
    funcionario.funcionario_setor_id = funcionario_setor_id;
    funcionario.funcionario_nivel = funcionario_nivel;
    funcionario.funcionario_cpf = funcionario_cpf;
    funcionario.funcionario_sexo = funcionario_sexo;
    funcionario.funcionario_salario = funcionario_salario;

    await funcionario.save();

    return res.status(200).json(funcionario);
  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    return res.status(500).json({ error: "Erro ao atualizar funcionário" });
  }
}

export async function postFuncionario(req, res) {
  const {
    funcionario_empresa_id,
    funcionario_setor_id,
    funcionario_nome,
    funcionario_cargo,
    funcionario_nivel,
    funcionario_cpf,
    funcionario_celular,
    funcionario_sexo,
    funcionario_data_nascimento,
    funcionario_data_admissao,
    funcionario_salario,
  } = req.body;
  const { usuario_id } = req.session.user;

  if (!usuario_id) {
    return res
      .status(401)
      .json({ error: "Necessário estar logado para realizar operações." });
  }

  if (
    !funcionario_nome ||
    !funcionario_cargo ||
    !funcionario_setor_id ||
    !funcionario_nivel ||
    !funcionario_cpf ||
    !funcionario_sexo ||
    !funcionario_salario ||
    !funcionario_empresa_id ||
    !funcionario_celular ||
    !funcionario_data_nascimento ||
    !funcionario_data_admissao
  ) {
    return res.status(400).json({ error: "Todos os dados são obrigatórios." });
  }

  try {
    const novoFuncionario = await Funcionario.create({
      funcionario_empresa_id,
      funcionario_setor_id,
      funcionario_nome,
      funcionario_cargo,
      funcionario_nivel,
      funcionario_cpf,
      funcionario_celular,
      funcionario_sexo,
      funcionario_data_nascimento,
      funcionario_data_admissao,
      funcionario_salario,
    });

    return res.status(201).json(novoFuncionario);
  } catch (err) {
    if (
      err instanceof UniqueConstraintError ||
      err?.parent?.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({ error: "Nome e/ou CPF já cadastrados" });
    }
    console.error("Erro ao criar funcionário:", err);
    return res.status(500).json({ error: "Erro ao criar funcionário" });
  }
}

export async function inativaFuncionario(req, res){
    const { id } = req.params;
    const { usuario_id } = req.session.user;
    
    if (!usuario_id) {
        return res
        .status(401)
        .json({ error: "Necessário estar logado para realizar operações." });
    }
    
    try {
        const funcionario = await Funcionario.findByPk(id);
    
        if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado." });
        }
    
        funcionario.funcionario_ativo = 0;
        await funcionario.save();
    
        return res.status(200).json({ message: "Funcionário inativado com sucesso." });
    } catch (err) {
        console.error("Erro ao inativar funcionário:", err);
        return res.status(500).json({ error: "Erro ao inativar funcionário" });
    }
}