import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Descricao extends Model {}

Descricao.init({
  descricao_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  descricao_cargo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descricao_setor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  descricao_treinamento: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descricao_comportamentos: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descricao_tecnicas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descricao_experiencia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descricao_responsabilidades: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "Descricao",
  tableName: "descricao_cargo",
  timestamps: false,
});

export default Descricao;