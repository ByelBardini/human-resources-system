-- Migration version-10: Adicionar campo empresa_ativo na tabela empresas
-- Permite inativar empresas sem removê-las do sistema
-- Adiciona permissão para gerenciar empresas

-- Verificar e adicionar coluna empresa_ativo
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'empresas' AND COLUMN_NAME = 'empresa_ativo';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`empresas` ADD COLUMN `empresa_ativo` TINYINT NOT NULL DEFAULT 1 AFTER `empresa_cor`',
  'SELECT ''Coluna empresa_ativo já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar empresas existentes como ativas
UPDATE `sistema_rh`.`empresas` SET `empresa_ativo` = 1 WHERE `empresa_ativo` IS NULL;

-- Inserir permissão para gerenciar empresas (ignorar se já existir)
INSERT IGNORE INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('sistema.gerenciar_empresas', 'Gerenciar Empresas', 'Permite cadastrar, editar e inativar empresas do sistema', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema' LIMIT 1));

-- Atribuir permissão sistema.gerenciar_empresas ao cargo Administrador (ignorar duplicatas)
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'sistema.gerenciar_empresas' LIMIT 1);
