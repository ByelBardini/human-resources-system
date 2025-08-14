import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Log extends Model {}

Log.init({
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  log_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  log_operacao_realizada: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  log_valor_antigo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  log_valor_novo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  log_data_alteracao: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "Log",
  tableName: "logs",
  timestamps: false,
});

export default Log;