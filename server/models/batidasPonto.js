import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class BatidaPonto extends Model {}

BatidaPonto.init(
  {
    batida_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    batida_funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    batida_data_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    batida_tipo: {
      type: DataTypes.ENUM("entrada", "saida"),
      allowNull: false,
    },
    batida_justificativa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "BatidaPonto",
    tableName: "batidas_ponto",
    timestamps: false,
  }
);

export default BatidaPonto;

