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
