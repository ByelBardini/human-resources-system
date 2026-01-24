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
      allowNull: true,
    },
    batida_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    batida_status: {
      type: DataTypes.ENUM("normal", "pendente", "aprovada", "recusada"),
      allowNull: false,
      defaultValue: "normal",
    },
    batida_aprovador_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    batida_data_aprovacao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    batida_observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    batida_foto_caminho: {
      type: DataTypes.STRING(255),
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
