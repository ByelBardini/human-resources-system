import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class CargoUsuario extends Model {}

CargoUsuario.init({
  cargo_usuario_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  cargo_usuario_nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  cargo_usuario_descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cargo_usuario_ativo: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  sequelize,
  modelName: "CargoUsuario",
  tableName: "cargos_usuarios",
  timestamps: false,
});

export default CargoUsuario;

