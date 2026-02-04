-- Migration version-15: Tipo atestado em Justificativas e Sistema de Detecção de Faltas
-- 1. Adicionar 'atestado' ao ENUM justificativa_tipo

-- =====================================================
-- 1. ALTERAR ENUM justificativa_tipo para incluir 'atestado'
-- =====================================================

ALTER TABLE `sistema_rh`.`justificativas`
MODIFY COLUMN `justificativa_tipo` ENUM(
  'esqueceu_bater',
  'entrada_atrasada',
  'saida_cedo',
  'falta_justificada',
  'consulta_medica',
  'horas_extras',
  'outros',
  'falta_nao_justificada',
  'atestado'
) NOT NULL;
