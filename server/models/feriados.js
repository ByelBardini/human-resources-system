import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Feriado extends Model {}

Feriado.init(
  {
    feriado_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    feriado_data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    feriado_nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    feriado_tipo: {
      type: DataTypes.ENUM("nacional", "empresa"),
      allowNull: false,
    },
    feriado_empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    feriado_repetir_ano: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    feriado_ativo: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "Feriado",
    tableName: "feriados",
    timestamps: false,
  }
);

export default Feriado;
