import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Notificacao extends Model {}

Notificacao.init(
  {
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
      type: DataTypes.ENUM(
        "falta",
        "meia-falta",
        "advertencia",
        "atestado",
        "suspensao"
      ),
      allowNull: false,
    },
    notificacao_data: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    notificacao_data_final: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    notificacao_descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notificacao_imagem_caminho: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Notificacao",
    tableName: "notificacoes",
    timestamps: false,
  }
);

export default Notificacao;
