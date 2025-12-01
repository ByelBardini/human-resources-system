import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class DiaTrabalhado extends Model {}

DiaTrabalhado.init(
  {
    dia_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    dia_funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dia_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dia_data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dia_horas_trabalhadas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    dia_horas_extras: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    dia_horas_negativas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    dia_status: {
      type: DataTypes.ENUM("normal", "divergente"),
      allowNull: false,
      defaultValue: "normal",
    },
    dia_entrada_prevista: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    dia_saida_prevista: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    dia_ultima_atualizacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "DiaTrabalhado",
    tableName: "dias_trabalhados",
    timestamps: false,
  }
);

export default DiaTrabalhado;

