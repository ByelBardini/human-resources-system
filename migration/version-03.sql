ALTER TABLE `sistema_rh`.`funcionarios` 
DROP COLUMN `funcionario_nivel`,
ADD COLUMN `funcionario_imagem_caminho` VARCHAR(255) NULL AFTER `funcionario_sexo`,
CHANGE COLUMN `funcionario_cargo` `funcionario_cargo_id` INT NOT NULL AFTER `funcionario_setor_id`,
ADD INDEX `funcionario_cargo_id_idx` (`funcionario_cargo_id` ASC) VISIBLE;
;
ALTER TABLE `sistema_rh`.`funcionarios` 
ADD CONSTRAINT `funcionario_cargo_id`
  FOREIGN KEY (`funcionario_cargo_id`)
  REFERENCES `sistema_rh`.`cargos` (`cargo_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
