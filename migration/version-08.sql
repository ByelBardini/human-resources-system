-- Migration version-08: Sistema de Aprovação de Batidas
-- Adiciona campos para controle de batidas pendentes de aprovação

-- Verificar e adicionar coluna batida_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND COLUMN_NAME = 'batida_status';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_status` ENUM(''normal'', ''pendente'', ''aprovada'', ''recusada'') NOT NULL DEFAULT ''normal'' AFTER `batida_justificativa_id`',
  'SELECT ''Coluna batida_status já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna batida_aprovador_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND COLUMN_NAME = 'batida_aprovador_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_aprovador_id` INT NULL AFTER `batida_status`',
  'SELECT ''Coluna batida_aprovador_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna batida_data_aprovacao
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND COLUMN_NAME = 'batida_data_aprovacao';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_data_aprovacao` DATETIME NULL AFTER `batida_aprovador_id`',
  'SELECT ''Coluna batida_data_aprovacao já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna batida_observacao
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND COLUMN_NAME = 'batida_observacao';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_observacao` TEXT NULL AFTER `batida_data_aprovacao`',
  'SELECT ''Coluna batida_observacao já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar índice batida_status_idx
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND INDEX_NAME = 'batida_status_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD INDEX `batida_status_idx` (`batida_status` ASC)',
  'SELECT ''Índice batida_status_idx já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar índice batida_aprovador_id_idx
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND INDEX_NAME = 'batida_aprovador_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD INDEX `batida_aprovador_id_idx` (`batida_aprovador_id` ASC)',
  'SELECT ''Índice batida_aprovador_id_idx já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar foreign key batida_aprovador_id_fk
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND CONSTRAINT_NAME = 'batida_aprovador_id_fk';
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD CONSTRAINT `batida_aprovador_id_fk` FOREIGN KEY (`batida_aprovador_id`) REFERENCES `sistema_rh`.`usuarios` (`usuario_id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT ''Constraint batida_aprovador_id_fk já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
