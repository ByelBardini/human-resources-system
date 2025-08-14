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
  funcionario_setor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  funcionario_cargo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  funcionario_nivel: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  funcionario_cpf: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  funcionario_celular: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  funcionario_sexo: {
    type: DataTypes.ENUM("masculino", "feminino"),
    allowNull: false,
  },
  funcionario_data_nascimento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  funcionario_data_admissao: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  funcionario_salario: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  funcionario_data_desligamento: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  sequelize,
  modelName: "Funcionario",
  tableName: "funcionarios",
  timestamps: false,
});

export default Funcionario;