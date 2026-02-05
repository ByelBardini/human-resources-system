-- Migration version-17: Permissão Emitir relatórios
-- Adicionar permissao sistema.emitir_relatorios

-- =====================================================
-- 1. ADICIONAR PERMISSAO sistema.emitir_relatorios
-- =====================================================

INSERT IGNORE INTO `sistema_rh`.`permissoes`
  (`permissao_codigo`, `permissao_nome`, `permissao_descricao`, `permissao_categoria_id`)
VALUES
  ('sistema.emitir_relatorios', 'Emitir relatórios', 'Permite exportar planilhas de funções, projeção salarial e funcionários', (
    SELECT categoria_id FROM `sistema_rh`.`categorias_permissao`
    WHERE categoria_codigo = 'sistema' LIMIT 1
  ));

-- Atribuir permissao sistema.emitir_relatorios ao cargo Administrador
INSERT IGNORE INTO `sistema_rh`.`cargo_permissoes` (`cargo_usuario_id`, `permissao_id`)
SELECT
  (SELECT cargo_usuario_id FROM `sistema_rh`.`cargos_usuarios` WHERE cargo_usuario_nome = 'Administrador' LIMIT 1),
  (SELECT permissao_id FROM `sistema_rh`.`permissoes` WHERE permissao_codigo = 'sistema.emitir_relatorios' LIMIT 1);
