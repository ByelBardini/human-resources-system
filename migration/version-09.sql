-- Migration version-09: Melhorias no Sistema de Controle de Ponto
-- 1. Adicionar campo banco_data_inicio na tabela bancos_horas
-- 2. Criar tabela cargo_permissao_empresas para permissões por empresa
-- 3. Adicionar campo usuario_data_criacao na tabela usuarios

-- =====================================================
-- 1. ADICIONAR CAMPO banco_data_inicio NA TABELA bancos_horas
-- =====================================================

-- Verificar e adicionar coluna banco_data_inicio
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'bancos_horas' AND COLUMN_NAME = 'banco_data_inicio';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`bancos_horas` ADD COLUMN `banco_data_inicio` DATE NULL DEFAULT NULL AFTER `banco_ultima_atualizacao`',
  'SELECT ''Coluna banco_data_inicio já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. CRIAR TABELA cargo_permissao_empresas
-- =====================================================

-- Criar tabela para vincular permissões específicas a empresas
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'cargo_permissao_empresas';
SET @sql = IF(@table_exists = 0,
  'CREATE TABLE `sistema_rh`.`cargo_permissao_empresas` (
    `cargo_permissao_empresa_id` INT NOT NULL AUTO_INCREMENT,
    `cargo_permissoes_id` INT NOT NULL,
    `empresa_id` INT NOT NULL,
    PRIMARY KEY (`cargo_permissao_empresa_id`),
    UNIQUE INDEX `cargo_permissao_empresa_unique` (`cargo_permissoes_id` ASC, `empresa_id` ASC),
    INDEX `fk_cpe_cargo_permissoes_idx` (`cargo_permissoes_id` ASC),
    INDEX `fk_cpe_empresa_idx` (`empresa_id` ASC),
    CONSTRAINT `fk_cpe_cargo_permissoes`
      FOREIGN KEY (`cargo_permissoes_id`)
      REFERENCES `sistema_rh`.`cargo_permissoes` (`cargo_permissoes_id`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION,
    CONSTRAINT `fk_cpe_empresa`
      FOREIGN KEY (`empresa_id`)
      REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
  ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci',
  'SELECT ''Tabela cargo_permissao_empresas já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. ADICIONAR CAMPO usuario_data_criacao NA TABELA usuarios
-- =====================================================

-- Verificar e adicionar coluna usuario_data_criacao
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'usuario_data_criacao';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD COLUMN `usuario_data_criacao` DATE NULL DEFAULT (CURDATE()) AFTER `usuario_empresa_id`',
  'SELECT ''Coluna usuario_data_criacao já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar usuários existentes com a data atual (para quem ainda não tem)
UPDATE `sistema_rh`.`usuarios` SET `usuario_data_criacao` = CURDATE() WHERE `usuario_data_criacao` IS NULL;

-- =====================================================
-- COMENTÁRIOS SOBRE AS FUNCIONALIDADES IMPLEMENTADAS
-- =====================================================

-- Funcionalidade 1: Correção da contabilização de horas
-- - Implementada diretamente no código (pontoController.js)
-- - Considera apenas dias até a data atual no mês corrente

-- Funcionalidade 2: Vínculo obrigatório de usuários funcionário
-- - Implementada diretamente no código (usuarioController.js)
-- - Valida que usuario_funcionario_id é obrigatório para tipo "funcionario"

-- Funcionalidade 3: Registro automático de atestados
-- - Implementada diretamente no código (justificativaController.js)
-- - Cria notificação automaticamente quando justificativa tem anexo e é do tipo médico

-- Funcionalidade 4: Zerar banco de horas
-- - banco_data_inicio: Armazena a data a partir da qual o banco deve ser calculado
-- - Ao zerar, define banco_data_inicio como dia 1 do mês atual

-- Funcionalidade 5: Permissões por empresa
-- - cargo_permissao_empresas: Vincula cada permissão de cargo a empresas específicas
-- - Se vazio, o usuário tem acesso a todas as empresas
-- - Se preenchido, restringe acesso apenas às empresas listadas
