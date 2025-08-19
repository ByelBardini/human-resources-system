import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Notificacao extends Model {}

Notificacao.init({
  notificacao_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  notificacao_funcionario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notificacao_tipo: {
    type: DataTypes.ENUM("falta", "meia-falta", "advertencia", "atestado"),
    allowNull: false,
  },
  notificacao_data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  notificacao_descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "Notificacao",
  tableName: "notificacoes",
  timestamps: false,
});

export default Notificacao;