import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Cargo extends Model {}

Cargo.init({
  cargo_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  cargo_empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cargo_nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  cargo_ativo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  sequelize,
  modelName: "Cargo",
  tableName: "cargos",
  timestamps: false,
});

export default Cargo;