import Empresa from "./empresas.js";
import Funcionario from "./funcionarios.js";
import Setor from "./setores.js";
import Usuario from "./usuarios.js";
import Log from "./logs.js";

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

export { Empresa, Funcionario, Setor, Usuario, Log };