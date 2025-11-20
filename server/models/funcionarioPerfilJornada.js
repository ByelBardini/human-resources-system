import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class FuncionarioPerfilJornada extends Model {}

FuncionarioPerfilJornada.init(
  {
    funcionario_perfil_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    perfil_jornada_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "FuncionarioPerfilJornada",
    tableName: "funcionario_perfil_jornada",
    timestamps: false,
  }
);

export default FuncionarioPerfilJornada;

