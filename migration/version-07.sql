-- Migration version-07: Refatoração do Sistema de Permissões
-- Organização por categorias e controle de acesso por empresa

-- 1. Criar tabela categorias_permissao (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`categorias_permissao` (
  `categoria_id` INT NOT NULL AUTO_INCREMENT,
  `categoria_codigo` VARCHAR(50) NOT NULL,
  `categoria_nome` VARCHAR(100) NOT NULL,
  `categoria_ordem` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`categoria_id`),
  UNIQUE INDEX `categoria_codigo_UNIQUE` (`categoria_codigo` ASC) VISIBLE);

-- 2. Adicionar campo permissao_categoria_id na tabela permissoes (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'permissoes' 
  AND COLUMN_NAME = 'permissao_categoria_id';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `sistema_rh`.`permissoes` ADD COLUMN `permissao_categoria_id` INT NULL AFTER `permissao_descricao`, ADD INDEX `permissao_categoria_id_idx` (`permissao_categoria_id` ASC) VISIBLE',
  'SELECT "Coluna permissao_categoria_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Adicionar foreign key para permissao_categoria_id (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'sistema_rh' 
  AND TABLE_NAME = 'permissoes' 
  AND CONSTRAINT_NAME = 'permissao_categoria_id';

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `sistema_rh`.`permissoes` ADD CONSTRAINT `permissao_categoria_id` FOREIGN KEY (`permissao_categoria_id`) REFERENCES `sistema_rh`.`categorias_permissao` (`categoria_id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT "Constraint permissao_categoria_id já existe" AS mensagem');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Criar tabela cargo_empresas (se não existir)
CREATE TABLE IF NOT EXISTS `sistema_rh`.`cargo_empresas` (
  `cargo_empresa_id` INT NOT NULL AUTO_INCREMENT,
  `cargo_usuario_id` INT NOT NULL,
  `empresa_id` INT NOT NULL,
  PRIMARY KEY (`cargo_empresa_id`),
  INDEX `cargo_empresas_cargo_usuario_id_idx` (`cargo_usuario_id` ASC) VISIBLE,
  INDEX `cargo_empresas_empresa_id_idx` (`empresa_id` ASC) VISIBLE,
  CONSTRAINT `cargo_empresas_cargo_usuario_id`
    FOREIGN KEY (`cargo_usuario_id`)
    REFERENCES `sistema_rh`.`cargos_usuarios` (`cargo_usuario_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `cargo_empresas_empresa_id`
    FOREIGN KEY (`empresa_id`)
    REFERENCES `sistema_rh`.`empresas` (`empresa_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  UNIQUE INDEX `cargo_empresas_unique` (`cargo_usuario_id` ASC, `empresa_id` ASC) VISIBLE);

-- 5. Inserir categorias de permissão
INSERT IGNORE INTO `sistema_rh`.`categorias_permissao` (`categoria_codigo`, `categoria_nome`, `categoria_ordem`) VALUES
('ponto', 'Ponto', 1),
('usuarios', 'Usuários', 2),
('cargos', 'Cargos', 3),
('sistema', 'Sistema', 4);

-- 6. Remover permissões antigas
DELETE FROM `sistema_rh`.`permissoes` WHERE `permissao_codigo` IN (
  'gerenciar_usuarios',
  'visualizar_funcionarios',
  'gerenciar_funcionarios',
  'gerenciar_cargos',
  'visualizar_funcoes',
  'registrar_ponto',
  'gerenciar_justificativas',
  'visualizar_relatorios_ponto',
  'gerenciar_perfis_jornada'
);

-- 7. Inserir novas permissões com categorias

-- Categoria: Ponto
INSERT INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('ponto.registrar', 'Registrar Ponto', 'Permite registrar batidas de ponto', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'ponto')),
('ponto.aprovar_justificativas', 'Aprovar/Reprovar Justificativas', 'Permite aprovar ou recusar justificativas de ponto', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'ponto')),
('ponto.criar_cargas_horarias', 'Criar Cargas Horárias', 'Permite criar e editar perfis de jornada de trabalho', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'ponto')),
('ponto.alterar_batidas', 'Alterar Batidas', 'Permite alterar batidas de ponto de funcionários', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'ponto'));

-- Categoria: Usuários
INSERT INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('usuarios.gerenciar', 'Gerenciar Usuários', 'Permite criar, editar e inativar usuários do sistema', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'usuarios')),
('usuarios.visualizar', 'Visualizar Usuários', 'Permite visualizar a lista de usuários do sistema', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'usuarios')),
('usuarios.gerenciar_funcionarios', 'Gerenciar Funcionários (Usuários)', 'Permite gerenciar funcionários que têm login no sistema', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'usuarios')),
('usuarios.visualizar_funcionarios', 'Visualizar Funcionários (Usuários)', 'Permite visualizar funcionários que têm login no sistema', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'usuarios'));

-- Categoria: Cargos
INSERT INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('cargos.gerenciar', 'Gerenciar Cargos de Usuários', 'Permite criar, editar cargos e atribuir permissões', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'cargos'));

-- Categoria: Sistema
INSERT INTO `sistema_rh`.`permissoes` (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`) VALUES
('sistema.visualizar_funcionarios', 'Visualizar Funcionários', 'Permite ver dados pessoais, cargo, etc (controle por empresa)', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema')),
('sistema.gerenciar_funcionarios', 'Gerenciar Funcionários', 'Permite cadastrar, editar e inativar funcionários (controle por empresa)', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema')),
('sistema.gerenciar_cargos', 'Gerenciar Cargos', 'Permite visualizar e alterar informações de cargos, níveis e projeção salarial', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema')),
('sistema.visualizar_funcoes', 'Visualizar Funções', 'Permite visualizar o manual descritivo de funções', (SELECT categoria_id FROM `sistema_rh`.`categorias_permissao` WHERE categoria_codigo = 'sistema'));

-- 8. Atribuir todas as permissões ao cargo Administrador
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  permissao_id
FROM `sistema_rh`.`permissoes`;

-- 9. Atribuir permissão de registrar ponto ao cargo Usuário Básico
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Usuário Básico' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'ponto.registrar' LIMIT 1);

-- 10. Vincular cargo Administrador a todas as empresas existentes
INSERT IGNORE INTO `sistema_rh`.`cargo_empresas` (`cargo_usuario_id`, `empresa_id`)
SELECT 
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  empresa_id
FROM `sistema_rh`.`empresas`;

