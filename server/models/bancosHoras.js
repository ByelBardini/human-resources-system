import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class BancoHoras extends Model {}

BancoHoras.init(
  {
    banco_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    banco_funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    banco_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    banco_saldo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    banco_ultima_atualizacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "BancoHoras",
    tableName: "bancos_horas",
    timestamps: false,
  }
);

export default BancoHoras;

