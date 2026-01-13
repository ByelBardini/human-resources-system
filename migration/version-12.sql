  -- Migration version-12: Adicionar campo feriado_repetir_ano na tabela feriados
  -- Permite marcar feriados para serem repetidos todos os anos

  -- Verificar e adicionar coluna feriado_repetir_ano
  SET @col_exists = 0;
  SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'feriados' AND COLUMN_NAME = 'feriado_repetir_ano';
  SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `sistema_rh`.`feriados` ADD COLUMN `feriado_repetir_ano` TINYINT NOT NULL DEFAULT 0 AFTER `feriado_empresa_id`',
    'SELECT ''Coluna feriado_repetir_ano já existe'' AS mensagem');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  -- Atualizar feriados existentes
  UPDATE `sistema_rh`.`feriados` SET `feriado_repetir_ano` = 0 WHERE `feriado_repetir_ano` IS NULL;
