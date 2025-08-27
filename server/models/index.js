import Empresa from "./empresas.js";
import Funcionario from "./funcionarios.js";
import Setor from "./setores.js";
import Usuario from "./usuarios.js";
import Log from "./logs.js";
import Nivel from "./niveis.js";
import Cargo from "./cargos.js";
import Notificacao from "./notificacoes.js";
import Descricao from "./descricoes.js";

// Foreign keys de setores e empresas
Empresa.hasMany(Setor, {
  foreignKey: "setor_empresa_id",
  sourceKey: "empresa_id",
  as: "setores",
});
Setor.belongsTo(Empresa, {
  foreignKey: "setor_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de funcionarios e setores
Setor.hasMany(Funcionario, {
  foreignKey: "funcionario_setor_id",
  sourceKey: "setor_id",
  as: "funcionarios",
});
Funcionario.belongsTo(Setor, {
  foreignKey: "funcionario_setor_id",
  targetKey: "setor_id",
  as: "setor",
});

//Foreign keys de funcionarios e empresas
Empresa.hasMany(Funcionario, {
  foreignKey: "funcionario_empresa_id",
  sourceKey: "empresa_id",
  as: "funcionarios",
});
Funcionario.belongsTo(Empresa, {
  foreignKey: "funcionario_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de funcionarios e niveis
Nivel.hasMany(Funcionario, {
  foreignKey: "funcionario_nivel_id",
  sourceKey: "nivel_id",
  as: "funcionarios",
});
Funcionario.belongsTo(Nivel, {
  foreignKey: "funcionario_nivel_id",
  targetKey: "nivel_id",
  as: "nivel",
});

//Foreign keys de funcionarios e cargos
Cargo.hasMany(Funcionario, {
  foreignKey: "funcionario_cargo_id",
  sourceKey: "cargo_id",
  as: "funcionarios",
});
Funcionario.belongsTo(Cargo, {
  foreignKey: "funcionario_cargo_id",
  targetKey: "cargo_id",
  as: "cargo",
});

//Foreign keys de logs e usuarios
Usuario.hasMany(Log, {
  foreignKey: "log_usuario_id",
  sourceKey: "usuario_id",
  as: "logs",
});
Log.belongsTo(Usuario, {
  foreignKey: "log_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});

//Foreign keys de cargos e empresas
Empresa.hasMany(Cargo, {
  foreignKey: "cargo_empresa_id",
  sourceKey: "empresa_id",
  as: "cargos",
});
Cargo.belongsTo(Empresa, {
  foreignKey: "cargo_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de niveis e cargos
Cargo.hasMany(Nivel, {
  foreignKey: "nivel_cargo_id",
  sourceKey: "cargo_id",
  as: "niveis",
});
Nivel.belongsTo(Cargo, {
  foreignKey: "nivel_cargo_id",
  targetKey: "cargo_id",
  as: "cargo",
  onDelete: "CASCADE",
});

//Foreign keys de Notificações e funcionários
Funcionario.hasMany(Notificacao, {
  foreignKey: "notificacao_funcionario_id",
  sourceKey: "funcionario_id",
  as: "notificacoes",
});
Notificacao.belongsTo(Funcionario, {
  foreignKey: "notificacao_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
  onDelete: "CASCADE",
});

//Foreign keys de Descrições e cargos
Cargo.hasMany(Descricao, {
  foreignKey: "descricao_cargo_id",
  sourceKey: "cargo_id",
  as: "descricoes",
});
Descricao.belongsTo(Cargo, {
  foreignKey: "descricao_cargo_id",
  targetKey: "cargo_id",
  as: "cargo",
  onDelete: "CASCADE",
});

//Foreign keys de Descrições e empresas
Empresa.hasMany(Descricao, {
  foreignKey: "descricao_empresa_id",
  sourceKey: "empresa_id",
  as: "descricoes",
});
Descricao.belongsTo(Empresa, {
  foreignKey: "descricao_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de Descrições e setores
Setor.hasMany(Descricao, {
  foreignKey: "descricao_setor_id",
  sourceKey: "setor_id",
  as: "descricoes",
});
Descricao.belongsTo(Setor, {
  foreignKey: "descricao_setor_id",
  targetKey: "setor_id",
  as: "setor",
});

// Logging Funcionário
Funcionario.afterCreate(async (instance, options) => {
  try {
    const usuario_id = options?.usuario_id || null;

    await Log.create(
      {
        log_usuario_id: usuario_id,
        log_operacao_realizada: "Funcionario Cadastrado",
        log_valor_antigo: "-",
        log_valor_novo: JSON.stringify(instance.toJSON()),
        log_data_alteracao: new Date(),
      },
      { transaction: options?.transaction }
    );
  } catch (e) {
    console.error("Erro ao registrar log (afterCreate):", e);
  }
});

Funcionario.afterUpdate(async (instance, options) => {
  const usuario_id = options.usuario_id || null;

  if (
    instance.changed("funcionario_ativo") &&
    instance.funcionario_ativo === 0
  ) {
    await Log.create({
      log_usuario_id: usuario_id,
      log_operacao_realizada: "Funcionario Desligado",
      log_valor_antigo: JSON.stringify(instance._previousDataValues),
      log_valor_novo: "-",
      log_data_alteracao: new Date(),
    });
  } else {
    await Log.create({
      log_usuario_id: usuario_id,
      log_operacao_realizada: "Funcionario Modificado",
      log_valor_antigo: JSON.stringify(instance._previousDataValues),
      log_valor_novo: JSON.stringify(instance.toJSON()),
      log_data_alteracao: new Date(),
    });
  }
});

//Logging Notificações

Notificacao.afterCreate(async (instance, options) => {
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAA");
  try {
    const usuario_id = options?.usuario_id || null;

    await Log.create(
      {
        log_usuario_id: usuario_id,
        log_operacao_realizada: "Notificacao Registrada",
        log_valor_antigo: "-",
        log_valor_novo: JSON.stringify(instance.toJSON()),
        log_data_alteracao: new Date(),
      },
      { transaction: options?.transaction }
    );
  } catch (e) {
    console.error("Erro ao registrar log (afterCreate):", e);
  }
});

// Logging Descrição

Descricao.afterUpdate(async (instance, options) => {
  const usuario_id = options.usuario_id || null;

  await Log.create({
    log_usuario_id: usuario_id,
    log_operacao_realizada: "Descricao Atualizada",
    log_valor_antigo: JSON.stringify(instance._previousDataValues),
    log_valor_novo: JSON.stringify(instance.toJSON()),
    log_data_alteracao: new Date(),
  });
});

// Logging cargo

Cargo.afterCreate(async (instance, options) => {
  const usuario_id = options.usuario_id || null;
  const salario_inicial = options.salario_inicial || null;

  const dados = instance.toJSON(); 

  const cargo = { ...dados, salario_inicial };

  await Log.create({
    log_usuario_id: usuario_id,
    log_operacao_realizada: "Cargo Criado",
    log_valor_antigo: "-",
    log_valor_novo: JSON.stringify(cargo),
    log_data_alteracao: new Date(),
  });
});

Cargo.afterDestroy(async (instance, options) => {
  const usuario_id = options.usuario_id || null;
  const salario_inicial = options.salario_inicial || null;

  const dados = instance.toJSON(); 

  const cargo = { ...dados, salario_inicial };

  await Log.create({
    log_usuario_id: usuario_id,
    log_operacao_realizada: "Cargo Excluído",
    log_valor_antigo: JSON.stringify(instance._previousDataValues),
    log_valor_novo: "-",
    log_data_alteracao: new Date(),
  });
});

export {
  Empresa,
  Funcionario,
  Setor,
  Usuario,
  Log,
  Nivel,
  Cargo,
  Descricao,
  Notificacao,
};
