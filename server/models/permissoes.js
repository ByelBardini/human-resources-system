import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Permissao extends Model {}

Permissao.init({
  permissao_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  permissao_codigo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  permissao_nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  permissao_descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "Permissao",
  tableName: "permissoes",
  timestamps: false,
});

export default Permissao;

