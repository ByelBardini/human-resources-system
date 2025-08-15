CREATE TABLE `sistema_rh`.`cargos` (
  `cargo_id` INT NOT NULL AUTO_INCREMENT,
  `cargo_empresa_id` INT NOT NULL,
  `cargo_nome` VARCHAR(100) NOT NULL,
  `cargo_descricao` TEXT NOT NULL,
  `cargo_ativo` TINYINT NOT NULL,
  PRIMARY KEY (`cargo_id`),
  INDEX `cargo_empresa_id_idx` (`cargo_empresa_id` ASC) VISIBLE,
  INDEX `cargo_setor_id_idx` (`cargo_setor_id` ASC) VISIBLE,
  CONSTRAINT `cargo_empresa_id`
    FOREIGN KEY (`cargo_empresa_id`)
    REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `sistema_rh`.`niveis` (
  `nivel_id` INT NOT NULL AUTO_INCREMENT,
  `nivel_cargo_id` INT NOT NULL,
  `nivel_nome` ENUM("Júnior I", "Júnior II", "Júnior III", "Pleno I", "Pleno II", "Pleno III", "Sênior I", "Sênior II", "Sênior III") NOT NULL,
  `nivel_salario` DOUBLE NOT NULL,
  PRIMARY KEY (`nivel_id`),
  INDEX `nivel_cargo_id_idx` (`nivel_cargo_id` ASC) VISIBLE,
  CONSTRAINT `nivel_cargo_id`
    FOREIGN KEY (`nivel_cargo_id`)
    REFERENCES `sistema_rh`.`cargos` (`cargo_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);

ALTER TABLE `sistema_rh`.`funcionarios` 
DROP COLUMN `funcionario_salario`,
ADD COLUMN `funcionario_nivel_id` INT NOT NULL AFTER `funcionario_setor_id`,
ADD INDEX `funcionario_nivel_id_idx` (`funcionario_nivel_id` ASC) VISIBLE;
;
ALTER TABLE `sistema_rh`.`funcionarios` 
ADD CONSTRAINT `funcionario_nivel_id`
  FOREIGN KEY (`funcionario_nivel_id`)
  REFERENCES `sistema_rh`.`niveis` (`nivel_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `sistema_rh`.`niveis` 
CHANGE COLUMN `nivel_nome` `nivel_nome` ENUM("Inicial", 'Júnior I', 'Júnior II', 'Júnior III', 'Pleno I', 'Pleno II', 'Pleno III', 'Sênior I', 'Sênior II', 'Sênior III') NOT NULL ;

ALTER TABLE `sistema_rh`.`cargos` 
CHANGE COLUMN `cargo_descricao` `cargo_descricao` TEXT NULL ,
CHANGE COLUMN `cargo_ativo` `cargo_ativo` TINYINT NOT NULL DEFAULT 1 ;

ALTER TABLE `sistema_rh`.`cargos` 
ADD UNIQUE INDEX `cargo_nome_UNIQUE` (`cargo_nome` ASC) VISIBLE;
;