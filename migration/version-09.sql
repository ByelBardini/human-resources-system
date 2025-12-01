-- Migration version-09: Vincular ponto diretamente ao usuário
-- Remove dependência de funcionário para o sistema de ponto

-- 1. Adicionar coluna usuario_id nas tabelas de ponto (mantendo funcionario_id por compatibilidade)

-- Tabela batidas_ponto
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND COLUMN_NAME = 'batida_usuario_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_usuario_id` INT NULL AFTER `batida_funcionario_id`',
  'SELECT ''Coluna batida_usuario_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabela dias_trabalhados
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'dias_trabalhados' AND COLUMN_NAME = 'dia_usuario_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`dias_trabalhados` ADD COLUMN `dia_usuario_id` INT NULL AFTER `dia_funcionario_id`',
  'SELECT ''Coluna dia_usuario_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabela bancos_horas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'bancos_horas' AND COLUMN_NAME = 'banco_usuario_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`bancos_horas` ADD COLUMN `banco_usuario_id` INT NULL AFTER `banco_funcionario_id`',
  'SELECT ''Coluna banco_usuario_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabela justificativas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'justificativas' AND COLUMN_NAME = 'justificativa_usuario_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`justificativas` ADD COLUMN `justificativa_usuario_id` INT NULL AFTER `justificativa_funcionario_id`',
  'SELECT ''Coluna justificativa_usuario_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Adicionar campo empresa_id no usuário para vincular funcionários a empresas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'usuario_empresa_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD COLUMN `usuario_empresa_id` INT NULL AFTER `usuario_funcionario_id`',
  'SELECT ''Coluna usuario_empresa_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Adicionar campo perfil_jornada_id no usuário
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'usuario_perfil_jornada_id';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD COLUMN `usuario_perfil_jornada_id` INT NULL AFTER `usuario_empresa_id`',
  'SELECT ''Coluna usuario_perfil_jornada_id já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Migrar dados existentes (popular usuario_id com base no funcionario vinculado)
UPDATE `sistema_rh`.`batidas_ponto` bp
INNER JOIN `sistema_rh`.`usuarios` u ON u.usuario_funcionario_id = bp.batida_funcionario_id
SET bp.batida_usuario_id = u.usuario_id
WHERE bp.batida_usuario_id IS NULL;

UPDATE `sistema_rh`.`dias_trabalhados` dt
INNER JOIN `sistema_rh`.`usuarios` u ON u.usuario_funcionario_id = dt.dia_funcionario_id
SET dt.dia_usuario_id = u.usuario_id
WHERE dt.dia_usuario_id IS NULL;

UPDATE `sistema_rh`.`bancos_horas` bh
INNER JOIN `sistema_rh`.`usuarios` u ON u.usuario_funcionario_id = bh.banco_funcionario_id
SET bh.banco_usuario_id = u.usuario_id
WHERE bh.banco_usuario_id IS NULL;

UPDATE `sistema_rh`.`justificativas` j
INNER JOIN `sistema_rh`.`usuarios` u ON u.usuario_funcionario_id = j.justificativa_funcionario_id
SET j.justificativa_usuario_id = u.usuario_id
WHERE j.justificativa_usuario_id IS NULL;

-- 5. Popular empresa_id e perfil_jornada_id no usuário com base no funcionário vinculado
UPDATE `sistema_rh`.`usuarios` u
INNER JOIN `sistema_rh`.`funcionarios` f ON u.usuario_funcionario_id = f.funcionario_id
SET u.usuario_empresa_id = f.funcionario_empresa_id
WHERE u.usuario_empresa_id IS NULL;

UPDATE `sistema_rh`.`usuarios` u
INNER JOIN `sistema_rh`.`funcionario_perfil_jornada` fpj ON u.usuario_funcionario_id = fpj.funcionario_id
SET u.usuario_perfil_jornada_id = fpj.perfil_jornada_id
WHERE u.usuario_perfil_jornada_id IS NULL;

-- 6. Modificar colunas funcionario_id para permitir NULL (já que agora usamos usuario_id)
ALTER TABLE `sistema_rh`.`batidas_ponto` MODIFY COLUMN `batida_funcionario_id` INT NULL;
ALTER TABLE `sistema_rh`.`dias_trabalhados` MODIFY COLUMN `dia_funcionario_id` INT NULL;
ALTER TABLE `sistema_rh`.`bancos_horas` MODIFY COLUMN `banco_funcionario_id` INT NULL;
ALTER TABLE `sistema_rh`.`justificativas` MODIFY COLUMN `justificativa_funcionario_id` INT NULL;

-- Remover constraint UNIQUE do banco_funcionario_id (se existir)
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'bancos_horas' AND INDEX_NAME = 'banco_funcionario_id';
SET @sql = IF(@idx_exists > 0,
  'ALTER TABLE `sistema_rh`.`bancos_horas` DROP INDEX `banco_funcionario_id`',
  'SELECT ''Índice banco_funcionario_id não existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Adicionar índices
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'batidas_ponto' AND INDEX_NAME = 'batida_usuario_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD INDEX `batida_usuario_id_idx` (`batida_usuario_id` ASC)',
  'SELECT ''Índice já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'dias_trabalhados' AND INDEX_NAME = 'dia_usuario_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`dias_trabalhados` ADD INDEX `dia_usuario_id_idx` (`dia_usuario_id` ASC)',
  'SELECT ''Índice já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'bancos_horas' AND INDEX_NAME = 'banco_usuario_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`bancos_horas` ADD INDEX `banco_usuario_id_idx` (`banco_usuario_id` ASC)',
  'SELECT ''Índice já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'justificativas' AND INDEX_NAME = 'justificativa_usuario_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`justificativas` ADD INDEX `justificativa_usuario_id_idx` (`justificativa_usuario_id` ASC)',
  'SELECT ''Índice já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'usuarios' AND INDEX_NAME = 'usuario_empresa_id_idx';
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD INDEX `usuario_empresa_id_idx` (`usuario_empresa_id` ASC)',
  'SELECT ''Índice já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
