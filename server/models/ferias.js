import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Ferias extends Model {}

Ferias.init(
  {
    ferias_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ferias_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    ferias_funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    ferias_data_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ferias_data_fim: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ferias_status: {
      type: DataTypes.ENUM("aprovada", "cancelada"),
      allowNull: false,
      defaultValue: "aprovada",
    },
    ferias_ativo: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "Ferias",
    tableName: "ferias",
    timestamps: false,
  }
);

export default Ferias;
