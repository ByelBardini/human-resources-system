import Empresa from "./empresas.js";
import Funcionario from "./funcionarios.js";
import Setor from "./setores.js";
import Usuario from "./usuarios.js";
import Log from "./logs.js";
import Nivel from "./niveis.js";
import Cargo from "./cargos.js";

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

//Foreign keys de usuarios e niveis
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

export { Empresa, Funcionario, Setor, Usuario, Log, Nivel, Cargo };
