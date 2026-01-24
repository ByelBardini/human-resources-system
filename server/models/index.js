import Empresa from "./empresas.js";
import Funcionario from "./funcionarios.js";
import Setor from "./setores.js";
import Usuario from "./usuarios.js";
import Log from "./logs.js";
import Nivel from "./niveis.js";
import Cargo from "./cargos.js";
import Notificacao from "./notificacoes.js";
import Descricao from "./descricoes.js";
import CargoUsuario from "./cargosUsuarios.js";
import Permissao from "./permissoes.js";
import CargoPermissao from "./cargoPermissoes.js";
import CategoriaPermissao from "./categoriasPermissao.js";
import CargoEmpresa from "./cargoEmpresas.js";
import PerfilJornada from "./perfisJornada.js";
import FuncionarioPerfilJornada from "./funcionarioPerfilJornada.js";
import BatidaPonto from "./batidasPonto.js";
import Justificativa from "./justificativas.js";
import DiaTrabalhado from "./diasTrabalhados.js";
import BancoHoras from "./bancosHoras.js";
import CargoPermissaoEmpresa from "./cargoPermissaoEmpresas.js";
import Feriado from "./feriados.js";
import Ferias from "./ferias.js";

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

//Foreign keys de Usuários e Cargos de Usuários
CargoUsuario.hasMany(Usuario, {
  foreignKey: "usuario_cargo_id",
  sourceKey: "cargo_usuario_id",
  as: "usuarios",
});
Usuario.belongsTo(CargoUsuario, {
  foreignKey: "usuario_cargo_id",
  targetKey: "cargo_usuario_id",
  as: "cargo",
});

//Foreign keys de Usuários e Funcionários (legado - mantido para compatibilidade)
Funcionario.hasOne(Usuario, {
  foreignKey: "usuario_funcionario_id",
  sourceKey: "funcionario_id",
  as: "usuario",
});
Usuario.belongsTo(Funcionario, {
  foreignKey: "usuario_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
});

//Foreign keys de Usuários e Perfis de Jornada (para usuários do tipo funcionário)
PerfilJornada.hasMany(Usuario, {
  foreignKey: "usuario_perfil_jornada_id",
  sourceKey: "perfil_jornada_id",
  as: "usuarios",
});
Usuario.belongsTo(PerfilJornada, {
  foreignKey: "usuario_perfil_jornada_id",
  targetKey: "perfil_jornada_id",
  as: "perfilJornada",
});

//Foreign keys de Usuários e Empresas (para usuários do tipo funcionário)
Empresa.hasMany(Usuario, {
  foreignKey: "usuario_empresa_id",
  sourceKey: "empresa_id",
  as: "usuariosFuncionarios",
});
Usuario.belongsTo(Empresa, {
  foreignKey: "usuario_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de Cargos de Usuários e Permissões (muitos-para-muitos)
CargoUsuario.belongsToMany(Permissao, {
  through: CargoPermissao,
  foreignKey: "cargo_usuario_id",
  otherKey: "permissao_id",
  as: "permissoes",
});
Permissao.belongsToMany(CargoUsuario, {
  through: CargoPermissao,
  foreignKey: "permissao_id",
  otherKey: "cargo_usuario_id",
  as: "cargos",
});

// Relacionamento direto CargoPermissao <-> Permissao
CargoPermissao.belongsTo(Permissao, {
  foreignKey: "permissao_id",
  as: "permissao",
});
Permissao.hasMany(CargoPermissao, {
  foreignKey: "permissao_id",
  as: "cargoPermissoes",
});

//Foreign keys de Permissões e Categorias
CategoriaPermissao.hasMany(Permissao, {
  foreignKey: "permissao_categoria_id",
  sourceKey: "categoria_id",
  as: "permissoes",
});
Permissao.belongsTo(CategoriaPermissao, {
  foreignKey: "permissao_categoria_id",
  targetKey: "categoria_id",
  as: "categoria",
});

//Foreign keys de Cargos de Usuários e Empresas (muitos-para-muitos)
CargoUsuario.belongsToMany(Empresa, {
  through: CargoEmpresa,
  foreignKey: "cargo_usuario_id",
  otherKey: "empresa_id",
  as: "empresas",
});
Empresa.belongsToMany(CargoUsuario, {
  through: CargoEmpresa,
  foreignKey: "empresa_id",
  otherKey: "cargo_usuario_id",
  as: "cargosUsuarios",
});

//Foreign keys de Funcionários e Perfis de Jornada (muitos-para-muitos)
Funcionario.belongsToMany(PerfilJornada, {
  through: FuncionarioPerfilJornada,
  foreignKey: "funcionario_id",
  otherKey: "perfil_jornada_id",
  as: "perfisJornada",
});
PerfilJornada.belongsToMany(Funcionario, {
  through: FuncionarioPerfilJornada,
  foreignKey: "perfil_jornada_id",
  otherKey: "funcionario_id",
  as: "funcionarios",
});

//Foreign keys de Funcionários e Batidas de Ponto
Funcionario.hasMany(BatidaPonto, {
  foreignKey: "batida_funcionario_id",
  sourceKey: "funcionario_id",
  as: "batidas",
});
BatidaPonto.belongsTo(Funcionario, {
  foreignKey: "batida_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
  onDelete: "CASCADE",
});

//Foreign keys de Funcionários e Justificativas
Funcionario.hasMany(Justificativa, {
  foreignKey: "justificativa_funcionario_id",
  sourceKey: "funcionario_id",
  as: "justificativas",
});
Justificativa.belongsTo(Funcionario, {
  foreignKey: "justificativa_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
  onDelete: "CASCADE",
});

//Foreign keys de Usuários e Justificativas (aprovador)
Usuario.hasMany(Justificativa, {
  foreignKey: "justificativa_aprovador_id",
  sourceKey: "usuario_id",
  as: "justificativasAprovadas",
});
Justificativa.belongsTo(Usuario, {
  foreignKey: "justificativa_aprovador_id",
  targetKey: "usuario_id",
  as: "aprovador",
});

//Foreign keys de Justificativas e Batidas de Ponto
Justificativa.hasMany(BatidaPonto, {
  foreignKey: "batida_justificativa_id",
  sourceKey: "justificativa_id",
  as: "batidas",
});
BatidaPonto.belongsTo(Justificativa, {
  foreignKey: "batida_justificativa_id",
  targetKey: "justificativa_id",
  as: "justificativa",
});

//Foreign keys de Usuários e Batidas de Ponto (aprovador)
Usuario.hasMany(BatidaPonto, {
  foreignKey: "batida_aprovador_id",
  sourceKey: "usuario_id",
  as: "batidasAprovadas",
});
BatidaPonto.belongsTo(Usuario, {
  foreignKey: "batida_aprovador_id",
  targetKey: "usuario_id",
  as: "aprovador",
});

//Foreign keys de Usuários e Batidas de Ponto (dono da batida)
Usuario.hasMany(BatidaPonto, {
  foreignKey: "batida_usuario_id",
  sourceKey: "usuario_id",
  as: "batidas",
});
BatidaPonto.belongsTo(Usuario, {
  foreignKey: "batida_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});

//Foreign keys de Usuários e Dias Trabalhados
Usuario.hasMany(DiaTrabalhado, {
  foreignKey: "dia_usuario_id",
  sourceKey: "usuario_id",
  as: "diasTrabalhados",
});
DiaTrabalhado.belongsTo(Usuario, {
  foreignKey: "dia_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});

//Foreign keys de Usuários e Bancos de Horas
Usuario.hasOne(BancoHoras, {
  foreignKey: "banco_usuario_id",
  sourceKey: "usuario_id",
  as: "bancoHoras",
});
BancoHoras.belongsTo(Usuario, {
  foreignKey: "banco_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});

//Foreign keys de Usuários e Justificativas (dono da justificativa)
Usuario.hasMany(Justificativa, {
  foreignKey: "justificativa_usuario_id",
  sourceKey: "usuario_id",
  as: "justificativas",
});
Justificativa.belongsTo(Usuario, {
  foreignKey: "justificativa_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});

//Foreign keys de Funcionários e Dias Trabalhados
Funcionario.hasMany(DiaTrabalhado, {
  foreignKey: "dia_funcionario_id",
  sourceKey: "funcionario_id",
  as: "diasTrabalhados",
});
DiaTrabalhado.belongsTo(Funcionario, {
  foreignKey: "dia_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
  onDelete: "CASCADE",
});

//Foreign keys de Funcionários e Bancos de Horas
Funcionario.hasOne(BancoHoras, {
  foreignKey: "banco_funcionario_id",
  sourceKey: "funcionario_id",
  as: "bancoHoras",
});
BancoHoras.belongsTo(Funcionario, {
  foreignKey: "banco_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
  onDelete: "CASCADE",
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

// Foreign keys de CargoPermissao e Empresas (para permissões específicas por empresa)
CargoPermissao.belongsToMany(Empresa, {
  through: CargoPermissaoEmpresa,
  foreignKey: "cargo_permissoes_id",
  otherKey: "empresa_id",
  as: "empresasPermitidas",
});
Empresa.belongsToMany(CargoPermissao, {
  through: CargoPermissaoEmpresa,
  foreignKey: "empresa_id",
  otherKey: "cargo_permissoes_id",
  as: "permissoesEspecificas",
});

// Relacionamento direto para acessar CargoPermissaoEmpresa
CargoPermissao.hasMany(CargoPermissaoEmpresa, {
  foreignKey: "cargo_permissoes_id",
  as: "empresasConfiguradas",
});
CargoPermissaoEmpresa.belongsTo(CargoPermissao, {
  foreignKey: "cargo_permissoes_id",
  as: "cargoPermissao",
});
CargoPermissaoEmpresa.belongsTo(Empresa, {
  foreignKey: "empresa_id",
  as: "empresa",
});

//Foreign keys de Feriados e Empresas
Empresa.hasMany(Feriado, {
  foreignKey: "feriado_empresa_id",
  sourceKey: "empresa_id",
  as: "feriados",
});
Feriado.belongsTo(Empresa, {
  foreignKey: "feriado_empresa_id",
  targetKey: "empresa_id",
  as: "empresa",
});

// Foreign keys de Ferias com Usuarios e Funcionarios
Usuario.hasMany(Ferias, {
  foreignKey: "ferias_usuario_id",
  sourceKey: "usuario_id",
  as: "ferias",
});
Ferias.belongsTo(Usuario, {
  foreignKey: "ferias_usuario_id",
  targetKey: "usuario_id",
  as: "usuario",
});
Funcionario.hasMany(Ferias, {
  foreignKey: "ferias_funcionario_id",
  sourceKey: "funcionario_id",
  as: "ferias",
});
Ferias.belongsTo(Funcionario, {
  foreignKey: "ferias_funcionario_id",
  targetKey: "funcionario_id",
  as: "funcionario",
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
  CargoUsuario,
  Permissao,
  CargoPermissao,
  CategoriaPermissao,
  CargoEmpresa,
  PerfilJornada,
  FuncionarioPerfilJornada,
  BatidaPonto,
  Justificativa,
  DiaTrabalhado,
  BancoHoras,
  CargoPermissaoEmpresa,
  Feriado,
  Ferias,
};
