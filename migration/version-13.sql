-- Migration version-13: Batidas fora da empresa
-- 1. Flag de batida fora da empresa no funcionario
-- 2. Foto obrigatoria na batida (campo de caminho)
-- 3. Permissao para invalidar batidas

-- =====================================================
-- 1. ADICIONAR CAMPO funcionario_batida_fora_empresa
-- =====================================================
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_rh'
  AND TABLE_NAME = 'funcionarios'
  AND COLUMN_NAME = 'funcionario_batida_fora_empresa';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`funcionarios` ADD COLUMN `funcionario_batida_fora_empresa` TINYINT NOT NULL DEFAULT 0 AFTER `funcionario_ativo`',
  'SELECT ''Coluna funcionario_batida_fora_empresa ja existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. ADICIONAR CAMPO batida_foto_caminho
-- =====================================================
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_rh'
  AND TABLE_NAME = 'batidas_ponto'
  AND COLUMN_NAME = 'batida_foto_caminho';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`batidas_ponto` ADD COLUMN `batida_foto_caminho` VARCHAR(255) NULL AFTER `batida_observacao`',
  'SELECT ''Coluna batida_foto_caminho ja existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. ADICIONAR PERMISSAO invalidar_batida_ponto
-- =====================================================
INSERT IGNORE INTO `sistema_rh`.`permissoes`
  (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`)
VALUES
  ('invalidar_batida_ponto', 'Invalidar Batida de Ponto', 'Permite invalidar batidas de ponto registradas', (
    SELECT categoria_id FROM `sistema_rh`.`categorias_permissao`
    WHERE categoria_codigo = 'ponto' LIMIT 1
  ));

-- Atribuir permissao ao cargo Administrador (ignorar duplicatas)
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'invalidar_batida_ponto' LIMIT 1);
