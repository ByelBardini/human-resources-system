import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Funcionario extends Model {}

Funcionario.init({
  funcionario_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  funcionario_empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  funcionario_setor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  funcionario_cargo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  funcionario_nivel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  funcionario_nome: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
  },
  funcionario_cpf: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  funcionario_celular: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  funcionario_sexo: {
    type: DataTypes.ENUM("masculino", "feminino"),
    allowNull: false,
  },
  funcionario_imagem_caminho: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  funcionario_data_nascimento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  funcionario_data_admissao: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  funcionario_data_desligamento: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  funcionario_ativo: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: "Funcionario",
  tableName: "funcionarios",
  timestamps: false,
});

export default Funcionario;