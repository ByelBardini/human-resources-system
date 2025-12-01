import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CargoEmpresa extends Model {}

CargoEmpresa.init({
  cargo_empresa_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  cargo_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "CargoEmpresa",
  tableName: "cargo_empresas",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['cargo_usuario_id', 'empresa_id'],
      name: 'cargo_empresas_unique'
    }
  ]
});

export default CargoEmpresa;

