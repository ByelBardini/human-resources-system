import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class PerfilJornada extends Model {}

PerfilJornada.init(
  {
    perfil_jornada_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    perfil_jornada_nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    perfil_jornada_segunda: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_terca: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_quarta: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_quinta: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_sexta: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_sabado: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_domingo: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: 0,
    },
    perfil_jornada_intervalo_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    perfil_jornada_ativo: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "PerfilJornada",
    tableName: "perfis_jornada",
    timestamps: false,
  }
);

export default PerfilJornada;

