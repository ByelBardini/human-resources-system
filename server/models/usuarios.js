import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Usuario extends Model {}

Usuario.init({
  usuario_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  usuario_nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  usuario_login: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  usuario_senha: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  usuario_cargo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_troca_senha: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  usuario_ativo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  usuario_funcionario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  usuario_perfil_jornada_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  usuario_empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  usuario_data_criacao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: "Usuario",
  tableName: "usuarios",
  timestamps: false,
});

export default Usuario;