import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Justificativa extends Model {}

Justificativa.init(
  {
    justificativa_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    justificativa_funcionario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    justificativa_data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    justificativa_tipo: {
      type: DataTypes.ENUM(
        "esqueceu_bater",
        "entrada_atrasada",
        "saida_cedo",
        "falta_justificada",
        "consulta_medica",
        "horas_extras",
        "outros",
        "falta_nao_justificada"
      ),
      allowNull: false,
    },
    justificativa_descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    justificativa_anexo_caminho: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    justificativa_status: {
      type: DataTypes.ENUM("pendente", "aprovada", "recusada"),
      allowNull: false,
      defaultValue: "pendente",
    },
    justificativa_aprovador_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    justificativa_data_aprovacao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Justificativa",
    tableName: "justificativas",
    timestamps: false,
  }
);

export default Justificativa;

