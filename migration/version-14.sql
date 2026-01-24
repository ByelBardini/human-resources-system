-- Migration version-14: Sistema de Ferias
-- 1. Criar tabela ferias
-- 2. Adicionar permissao sistema.gerenciar_ferias

-- =====================================================
-- 1. CRIAR TABELA ferias
-- =====================================================

SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'ferias';
SET @sql = IF(@table_exists = 0,
  'CREATE TABLE `sistema_rh`.`ferias` (
    `ferias_id` INT NOT NULL AUTO_INCREMENT,
    `ferias_usuario_id` INT NULL DEFAULT NULL,
    `ferias_funcionario_id` INT NULL DEFAULT NULL,
    `ferias_data_inicio` DATE NOT NULL,
    `ferias_data_fim` DATE NOT NULL,
    `ferias_status` ENUM(''aprovada'', ''cancelada'') NOT NULL DEFAULT ''aprovada'',
    `ferias_ativo` TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (`ferias_id`),
    INDEX `ferias_usuario_id_idx` (`ferias_usuario_id` ASC),
    INDEX `ferias_funcionario_id_idx` (`ferias_funcionario_id` ASC),
    INDEX `ferias_data_inicio_idx` (`ferias_data_inicio` ASC),
    INDEX `ferias_data_fim_idx` (`ferias_data_fim` ASC),
    CONSTRAINT `fk_ferias_usuario`
      FOREIGN KEY (`ferias_usuario_id`)
      REFERENCES `sistema_rh`.`usuarios` (`usuario_id`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION,
    CONSTRAINT `fk_ferias_funcionario`
      FOREIGN KEY (`ferias_funcionario_id`)
      REFERENCES `sistema_rh`.`funcionarios` (`funcionario_id`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
  ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci',
  'SELECT ''Tabela ferias ja existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. ADICIONAR PERMISSAO sistema.gerenciar_ferias
-- =====================================================

INSERT IGNORE INTO `sistema_rh`.`permissoes`
  (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`)
VALUES
  ('sistema.gerenciar_ferias', 'Gerenciar Ferias', 'Permite cadastrar, editar e excluir ferias', (
    SELECT categoria_id FROM `sistema_rh`.`categorias_permissao`
    WHERE categoria_codigo = 'sistema' LIMIT 1
  ));

-- Atribuir permissao sistema.gerenciar_ferias ao cargo Administrador
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'sistema.gerenciar_ferias' LIMIT 1);
