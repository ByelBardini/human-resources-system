-- Migration version-05: Sistema de Permissões e Cargos
-- Esta migration pode ser executada mesmo se já foi parcialmente executada

-- 1. Criar tabela cargos_usuarios (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`cargos_usuarios` (
  `cargo_usuario_id` INT NOT NULL AUTO_INCREMENT,
  `cargo_usuario_nome` VARCHAR(150) NOT NULL,
  `cargo_usuario_descricao` TEXT NULL,
  `cargo_usuario_ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`cargo_usuario_id`),
  UNIQUE INDEX `cargo_usuario_nome_UNIQUE` (`cargo_usuario_nome` ASC) VISIBLE);

-- 2. Criar tabela permissoes (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`permissoes` (
  `permissao_id` INT NOT NULL AUTO_INCREMENT,
  `permissao_codigo` VARCHAR(100) NOT NULL,
  `permissao_nome` VARCHAR(150) NOT NULL,
  `permissao_descricao` TEXT NULL,
  PRIMARY KEY (`permissao_id`),
  UNIQUE INDEX `permissao_codigo_UNIQUE` (`permissao_codigo` ASC) VISIBLE);

-- 3. Criar tabela cargo_permissoes (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`cargo_permissoes` (
  `cargo_permissoes_id` INT NOT NULL AUTO_INCREMENT,
  `cargo_usuario_id` INT NOT NULL,
  `permissao_id` INT NOT NULL,
  PRIMARY KEY (`cargo_permissoes_id`),
  INDEX `cargo_permissoes_cargo_usuario_id_idx` (`cargo_usuario_id` ASC) VISIBLE,
  INDEX `cargo_permissoes_permissao_id_idx` (`permissao_id` ASC) VISIBLE,
  CONSTRAINT `cargo_permissoes_cargo_usuario_id`
    FOREIGN KEY (`cargo_usuario_id`)
    REFERENCES `sistema_rh`.`cargos_usuarios` (`cargo_usuario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `cargo_permissoes_permissao_id`
    FOREIGN KEY (`permissao_id`)
    REFERENCES `sistema_rh`.`permissoes` (`permissao_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  UNIQUE INDEX `cargo_permissoes_unique` (`cargo_usuario_id` ASC, `permissao_id` ASC) VISIBLE);

-- 4. Adicionar campo usuario_cargo_id na tabela usuarios (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'usuario_cargo_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD COLUMN `usuario_cargo_id` INT NULL AFTER `usuario_ativo`, ADD INDEX `usuario_cargo_id_idx` (`usuario_cargo_id` ASC) VISIBLE',
  'SELECT "Coluna usuario_cargo_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Adicionar foreign key para usuario_cargo_id (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND CONSTRAINT_NAME = 'usuario_cargo_id';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD CONSTRAINT `usuario_cargo_id` FOREIGN KEY (`usuario_cargo_id`) REFERENCES `sistema_rh`.`cargos_usuarios` (`cargo_usuario_id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT "Constraint usuario_cargo_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Inserir permissões padrão (ignorar se já existirem)
INSERT IGNORE INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`) VALUES
('gerenciar_usuarios', 'Gerenciar Usuários', 'Permite visualizar e editar usuários. Permite gerenciar os cargos e permissões'),
('visualizar_funcionarios', 'Visualizar Funcionários', 'Pode ver os detalhes dos funcionários, mas não editar'),
('gerenciar_funcionarios', 'Gerenciar Funcionários', 'Permite editar os funcionários, cadastrar, inativar, etc'),
('gerenciar_cargos', 'Gerenciar Cargos', 'Permite visualizar e alterar as informações dos cargos e níveis, o que inclui a tela de projeção salarial. Permite gerenciar a descrição das funções'),
('visualizar_funcoes', 'Visualizar Funções', 'Permite visualizar o manual descritivo de funções');

-- 7. Criar cargos padrão (ignorar se já existirem)
INSERT IGNORE INTO `sistema_rh`.`cargos_usuarios` (`cargo_usuario_nome`, `cargo_usuario_descricao`, `cargo_usuario_ativo`) VALUES
('Administrador', 'Cargo com todas as permissões do sistema', 1),
('Usuário Básico', 'Cargo básico com permissões limitadas', 1);

-- 8. Atribuir todas as permissões ao cargo Administrador (ignorar duplicatas)
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  permissao_id
FROM `sistema_rh`.`permissoes`;

-- 9. Migrar usuários existentes (apenas se ainda tiverem usuario_role)
UPDATE `sistema_rh`.`usuarios` 
SET `usuario_cargo_id` = (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1)
WHERE `usuario_role` = 'adm' AND (`usuario_cargo_id` IS NULL OR `usuario_cargo_id` = 0);

UPDATE `sistema_rh`.`usuarios` 
SET `usuario_cargo_id` = (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Usuário Básico' LIMIT 1)
WHERE `usuario_role` = 'usuario' AND (`usuario_cargo_id` IS NULL OR `usuario_cargo_id` = 0);

-- 10. Remover constraint foreign key temporária (se existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND CONSTRAINT_NAME = 'usuario_cargo_id'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `sistema_rh`.`usuarios` DROP FOREIGN KEY `usuario_cargo_id`',
  'SELECT "Constraint usuario_cargo_id não existe ou já foi removida" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 11. Tornar usuario_cargo_id NOT NULL (se ainda não for)
SET @col_nullable = 0;
SELECT COUNT(*) INTO @col_nullable 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'usuario_cargo_id'
  AND IS_NULLABLE = 'YES';

SET @sql = IF(@col_nullable > 0,
  'ALTER TABLE `sistema_rh`.`usuarios` CHANGE COLUMN `usuario_cargo_id` `usuario_cargo_id` INT NOT NULL',
  'SELECT "Coluna usuario_cargo_id já é NOT NULL" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 12. Recriar constraint foreign key com ON DELETE NO ACTION (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND CONSTRAINT_NAME = 'usuario_cargo_id';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`usuarios` ADD CONSTRAINT `usuario_cargo_id` FOREIGN KEY (`usuario_cargo_id`) REFERENCES `sistema_rh`.`cargos_usuarios` (`cargo_usuario_id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
  'SELECT "Constraint usuario_cargo_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 13. Remover coluna usuario_role (se ainda existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'usuario_role';

SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `sistema_rh`.`usuarios` DROP COLUMN `usuario_role`',
  'SELECT "Coluna usuario_role já foi removida" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
