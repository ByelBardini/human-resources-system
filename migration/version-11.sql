-- Migration version-11: Sistema de Feriados
-- Adiciona tabela de feriados nacionais e por empresa
-- NOTA: Para popular os feriados nacionais, execute o script:
-- node scripts/popularFeriados.js [ano_inicio] [ano_fim]
-- Exemplo: node scripts/popularFeriados.js 2020 2030

-- =====================================================
-- 1. CRIAR TABELA feriados
-- =====================================================

SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'sistema_rh' AND TABLE_NAME = 'feriados';
SET @sql = IF(@table_exists = 0,
  'CREATE TABLE `sistema_rh`.`feriados` (
    `feriado_id` INT NOT NULL AUTO_INCREMENT,
    `feriado_data` DATE NOT NULL,
    `feriado_nome` VARCHAR(200) NOT NULL,
    `feriado_tipo` ENUM(''nacional'', ''empresa'') NOT NULL,
    `feriado_empresa_id` INT NULL DEFAULT NULL,
    `feriado_repetir_ano` TINYINT NOT NULL DEFAULT 0,
    `feriado_ativo` TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (`feriado_id`),
    INDEX `feriado_data_idx` (`feriado_data` ASC),
    INDEX `feriado_tipo_idx` (`feriado_tipo` ASC),
    INDEX `feriado_empresa_id_idx` (`feriado_empresa_id` ASC),
    CONSTRAINT `fk_feriado_empresa`
      FOREIGN KEY (`feriado_empresa_id`)
      REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
  ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci',
  'SELECT ''Tabela feriados já existe'' AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. ADICIONAR PERMISSÃO sistema.gerenciar_feriados
-- =====================================================

INSERT IGNORE INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('sistema.gerenciar_feriados', 'Gerenciar Feriados', 'Permite cadastrar, editar e excluir feriados', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema' LIMIT 1));

-- Atribuir permissão sistema.gerenciar_feriados ao cargo Administrador
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'sistema.gerenciar_feriados' LIMIT 1);
