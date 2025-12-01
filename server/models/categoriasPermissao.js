import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CategoriaPermissao extends Model {}

CategoriaPermissao.init({
  categoria_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  categoria_codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  categoria_nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  categoria_ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: "CategoriaPermissao",
  tableName: "categorias_permissao",
  timestamps: false,
});

export default CategoriaPermissao;

