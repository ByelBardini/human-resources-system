-- Migration version-06: Sistema de Batida de Ponto
-- Esta migration pode ser executada mesmo se já foi parcialmente executada

-- 1. Criar tabela perfis_jornada (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`perfis_jornada` (
  `perfil_jornada_id` INT NOT NULL AUTO_INCREMENT,
  `perfil_jornada_nome` VARCHAR(150) NOT NULL,
  `perfil_jornada_segunda` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_terca` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_quarta` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_quinta` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_sexta` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_sabado` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_domingo` DECIMAL(4,2) NULL DEFAULT 0,
  `perfil_jornada_intervalo_minimo` INT NOT NULL DEFAULT 60 COMMENT 'Intervalo mínimo em minutos',
  `perfil_jornada_ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`perfil_jornada_id`),
  UNIQUE INDEX `perfil_jornada_nome_UNIQUE` (`perfil_jornada_nome` ASC) VISIBLE);

-- 2. Criar tabela funcionario_perfil_jornada (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`funcionario_perfil_jornada` (
  `funcionario_perfil_id` INT NOT NULL AUTO_INCREMENT,
  `funcionario_id` INT NOT NULL,
  `perfil_jornada_id` INT NOT NULL,
  PRIMARY KEY (`funcionario_perfil_id`),
  INDEX `funcionario_perfil_funcionario_id_idx` (`funcionario_id` ASC) VISIBLE,
  INDEX `funcionario_perfil_jornada_id_idx` (`perfil_jornada_id` ASC) VISIBLE,
  CONSTRAINT `funcionario_perfil_funcionario_id`
    FOREIGN KEY (`funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `funcionario_perfil_jornada_id`
    FOREIGN KEY (`perfil_jornada_id`)
    REFERENCES `sistema_rh`.`perfis_jornada` (`perfil_jornada_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  UNIQUE INDEX `funcionario_perfil_unique` (`funcionario_id` ASC, `perfil_jornada_id` ASC) VISIBLE);

-- 3. Criar tabela batidas_ponto (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`batidas_ponto` (
  `batida_id` INT NOT NULL AUTO_INCREMENT,
  `batida_funcionario_id` INT NOT NULL,
  `batida_data_hora` DATETIME NOT NULL,
  `batida_tipo` ENUM('entrada', 'saida') NOT NULL,
  `batida_justificativa_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`batida_id`),
  INDEX `batida_funcionario_id_idx` (`batida_funcionario_id` ASC) VISIBLE,
  INDEX `batida_data_hora_idx` (`batida_data_hora` ASC) VISIBLE,
  INDEX `batida_justificativa_id_idx` (`batida_justificativa_id` ASC) VISIBLE,
  CONSTRAINT `batida_funcionario_id`
    FOREIGN KEY (`batida_funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);

-- 4. Criar tabela justificativas (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`justificativas` (
  `justificativa_id` INT NOT NULL AUTO_INCREMENT,
  `justificativa_funcionario_id` INT NOT NULL,
  `justificativa_data` DATE NOT NULL,
  `justificativa_tipo` ENUM('esqueceu_bater', 'entrada_atrasada', 'saida_cedo', 'falta_justificada', 'consulta_medica', 'horas_extras', 'outros', 'falta_nao_justificada') NOT NULL,
  `justificativa_descricao` TEXT NULL,
  `justificativa_anexo_caminho` VARCHAR(255) NULL,
  `justificativa_status` ENUM('pendente', 'aprovada', 'recusada') NOT NULL DEFAULT 'pendente',
  `justificativa_aprovador_id` INT NULL DEFAULT NULL,
  `justificativa_data_aprovacao` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`justificativa_id`),
  INDEX `justificativa_funcionario_id_idx` (`justificativa_funcionario_id` ASC) VISIBLE,
  INDEX `justificativa_data_idx` (`justificativa_data` ASC) VISIBLE,
  INDEX `justificativa_aprovador_id_idx` (`justificativa_aprovador_id` ASC) VISIBLE,
  CONSTRAINT `justificativa_funcionario_id`
    FOREIGN KEY (`justificativa_funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `justificativa_aprovador_id`
    FOREIGN KEY (`justificativa_aprovador_id`)
    REFERENCES `sistema_rh`.`usuarios` (`usuario_id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION);

-- 5. Adicionar foreign key de batida_justificativa_id (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'batidas_ponto' 
  AND CONSTRAINT_NAME = 'batida_justificativa_id';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD CONSTRAINT `batida_justificativa_id` FOREIGN KEY (`batida_justificativa_id`) REFERENCES `sistema_rh`.`justificativas` (`justificativa_id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT "Constraint batida_justificativa_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Criar tabela dias_trabalhados (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`dias_trabalhados` (
  `dia_id` INT NOT NULL AUTO_INCREMENT,
  `dia_funcionario_id` INT NOT NULL,
  `dia_data` DATE NOT NULL,
  `dia_horas_trabalhadas` DECIMAL(5,2) NULL DEFAULT 0 COMMENT 'Horas trabalhadas em decimal',
  `dia_horas_extras` DECIMAL(5,2) NULL DEFAULT 0 COMMENT 'Horas extras em decimal',
  `dia_horas_negativas` DECIMAL(5,2) NULL DEFAULT 0 COMMENT 'Horas negativas em decimal',
  `dia_status` ENUM('normal', 'divergente') NOT NULL DEFAULT 'normal',
  `dia_entrada_prevista` TIME NULL,
  `dia_saida_prevista` TIME NULL,
  `dia_ultima_atualizacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dia_id`),
  INDEX `dia_funcionario_id_idx` (`dia_funcionario_id` ASC) VISIBLE,
  INDEX `dia_data_idx` (`dia_data` ASC) VISIBLE,
  UNIQUE INDEX `dia_funcionario_data_unique` (`dia_funcionario_id` ASC, `dia_data` ASC) VISIBLE,
  CONSTRAINT `dia_funcionario_id`
    FOREIGN KEY (`dia_funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);

-- 7. Criar tabela bancos_horas (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`bancos_horas` (
  `banco_id` INT NOT NULL AUTO_INCREMENT,
  `banco_funcionario_id` INT NOT NULL,
  `banco_saldo` INT NOT NULL DEFAULT 0 COMMENT 'Saldo em minutos (positivo ou negativo)',
  `banco_ultima_atualizacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`banco_id`),
  UNIQUE INDEX `banco_funcionario_id_UNIQUE` (`banco_funcionario_id` ASC) VISIBLE,
  CONSTRAINT `banco_funcionario_id`
    FOREIGN KEY (`banco_funcionario_id`)
    REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);

-- 8. Adicionar campo usuario_funcionario_id na tabela usuarios (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'usuario_funcionario_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD COLUMN `usuario_funcionario_id` INT NULL AFTER `usuario_ativo`, ADD INDEX `usuario_funcionario_id_idx` (`usuario_funcionario_id` ASC) VISIBLE',
  'SELECT "Coluna usuario_funcionario_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 9. Adicionar foreign key para usuario_funcionario_id (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND CONSTRAINT_NAME = 'usuario_funcionario_id';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD CONSTRAINT `usuario_funcionario_id` FOREIGN KEY (`usuario_funcionario_id`) REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT "Constraint usuario_funcionario_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. Inserir permissões padrão (ignorar se já existirem)
INSERT IGNORE INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`) VALUES
('registrar_ponto', 'Registrar Ponto', 'Permite registrar batidas de ponto'),
('gerenciar_justificativas', 'Gerenciar Justificativas', 'Permite aprovar ou recusar justificativas de ponto'),
('visualizar_relatorios_ponto', 'Visualizar Relatórios de Ponto', 'Permite visualizar relatórios de ponto'),
('gerenciar_perfis_jornada', 'Gerenciar Perfis de Jornada', 'Permite criar e editar perfis de jornada de trabalho');

-- 11. Atribuir permissão registrar_ponto ao cargo Usuário Básico (ignorar duplicatas)
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Usuário Básico' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'registrar_ponto' LIMIT 1);

INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Usuário Básico' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'visualizar_relatorios_ponto' LIMIT 1);

