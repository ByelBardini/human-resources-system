CREATE TABLE `sistema_rh`.`notificacoes` (
  `notificacao_id` INT NOT NULL AUTO_INCREMENT,
  `notificacao_funcionario_id` INT NOT NULL,
  `notificacao_tipo` ENUM("falta", "meia-falta", "advertencia", "atestado") NOT NULL,
  `notificadao_data` DATE NOT NULL,
  `notificacao_descricao` TEXT NULL,
  PRIMARY KEY (`notificacao_id`),
  INDEX `notificacao_funcionario_id_idx` (`notificacao_funcionario_id` ASC) VISIBLE,
  CONSTRAINT `notificacao_funcionario_id`
    FOREIGN KEY (`notificacao_funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);

CREATE TABLE `sistema_rh`.`descricao_cargo` (
  `descricao_id` INT NOT NULL AUTO_INCREMENT,
  `descricao_cargo_id` INT NOT NULL,
  `descricao_setor_id` INT NULL,
  `descricao_treinamento` TEXT NULL,
  `descricao_comportamentos` TEXT NULL,
  `descricao_tecnicas` TEXT NULL,
  `descricao_experiencia` TEXT NULL,
  `descricao_responsabilidades` TEXT NULL,
  PRIMARY KEY (`descricao_id`),
  INDEX `descricao_cargo_id_idx` (`descricao_cargo_id` ASC) VISIBLE,
  INDEX `descricao_setor_id_idx` (`descricao_setor_id` ASC) VISIBLE,
  CONSTRAINT `descricao_cargo_id`
    FOREIGN KEY (`descricao_cargo_id`)
    REFERENCES `sistema_rh`.`cargos` (`cargo_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `descricao_setor_id`
    FOREIGN KEY (`descricao_setor_id`)
    REFERENCES `sistema_rh`.`setores` (`setor_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `sistema_rh`.`cargos` 
DROP COLUMN `cargo_descricao`;

ALTER TABLE `sistema_rh`.`descricao_cargo` 
ADD COLUMN `descricao_empresa_id` INT NOT NULL AFTER `descricao_id`,
ADD INDEX `descricao_empresa_id_idx` (`descricao_empresa_id` ASC) VISIBLE;
;
ALTER TABLE `sistema_rh`.`descricao_cargo` 
ADD CONSTRAINT `descricao_empresa_id`
  FOREIGN KEY (`descricao_empresa_id`)
  REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE `sistema_rh`.`descricao_cargo` 
ADD COLUMN `descricao_escolaridade` TEXT NULL AFTER `descricao_treinamento`;

ALTER TABLE `sistema_rh`.`descricao_cargo` 
DROP FOREIGN KEY `descricao_cargo_id`;
ALTER TABLE `sistema_rh`.`descricao_cargo` 
ADD CONSTRAINT `descricao_cargo_id`
  FOREIGN KEY (`descricao_cargo_id`)
  REFERENCES `sistema_rh`.`cargos` (`cargo_id`)
  ON DELETE CASCADE;
