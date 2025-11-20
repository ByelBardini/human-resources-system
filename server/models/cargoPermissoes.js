import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CargoPermissao extends Model {}

CargoPermissao.init({
  cargo_permissoes_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  cargo_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permissao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "CargoPermissao",
  tableName: "cargo_permissoes",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['cargo_usuario_id', 'permissao_id'],
      name: 'cargo_permissoes_unique'
    }
  ]
});

export default CargoPermissao;

