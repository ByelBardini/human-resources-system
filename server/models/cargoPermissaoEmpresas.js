import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CargoPermissaoEmpresa extends Model {}

CargoPermissaoEmpresa.init(
  {
    cargo_permissao_empresa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    cargo_permissoes_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "CargoPermissaoEmpresa",
    tableName: "cargo_permissao_empresas",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["cargo_permissoes_id", "empresa_id"],
        name: "cargo_permissao_empresa_unique",
      },
    ],
  }
);

export default CargoPermissaoEmpresa;


