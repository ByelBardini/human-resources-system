CREATE SCHEMA `sistema_rh` ;

CREATE TABLE `sistema_rh`.`empresas` (
  `empresa_id` INT NOT NULL AUTO_INCREMENT,
  `empresa_imagem` MEDIUMBLOB NULL,
  `empresa_nome` VARCHAR(150) NOT NULL,
  `empresa_cnpj` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`empresa_id`));

CREATE TABLE `sistema_rh`.`setores` (
  `setor_id` INT NOT NULL AUTO_INCREMENT,
  `setor_empresa_id` INT NOT NULL,
  `setor_nome` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`setor_id`),
  INDEX `setor_empresa_id_idx` (`setor_empresa_id` ASC) VISIBLE,
  CONSTRAINT `setor_empresa_id`
    FOREIGN KEY (`setor_empresa_id`)
    REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `sistema_rh`.`funcionarios` (
  `funcionario_id` INT NOT NULL AUTO_INCREMENT,
  `funcionario_setor_id` INT NOT NULL,
  `funcionario_cargo` VARCHAR(150) NOT NULL,
  `funcionario_nivel` VARCHAR(150) NOT NULL,
  `funcionario_cpf` VARCHAR(100) NOT NULL,
  `funcionario_celular` VARCHAR(100) NOT NULL,
  `funcionario_sexo` ENUM('masculino', 'feminino') NOT NULL,
  `funcionario_data_nascimento` DATE NOT NULL,
  `funcionario_data_admissao` DATE NOT NULL,
  `funcionario_salario` DOUBLE NOT NULL,
  `funcionario_data_desligamento` DATE NULL,
  PRIMARY KEY (`funcionario_id`),
  INDEX `funcionario_setor_id_idx` (`funcionario_setor_id` ASC) VISIBLE,
  CONSTRAINT `funcionario_setor_id`
    FOREIGN KEY (`funcionario_setor_id`)
    REFERENCES `sistema_rh`.`setores` (`setor_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
