import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Nivel extends Model {}

Nivel.init({
  nivel_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nivel_cargo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nivel_nome: {
    type: DataTypes.ENUM("Inicial", "Júnior I", "Júnior II", "Júnior III", "Pleno I", "Pleno II", "Pleno III", "Sênior I", "Sênior II", "Sênior III"),
    allowNull: false,
  },
  nivel_salario: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "Nivel",
  tableName: "niveis",
  timestamps: false,
});

export default Nivel;