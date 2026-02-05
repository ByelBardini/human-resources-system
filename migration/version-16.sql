-- Migration version-16: Alteração manual de horário de batidas por admin
-- Campos para marcar batida alterada e auditoria

-- =====================================================
-- 1. ADICIONAR COLUNAS EM batidas_ponto
-- =====================================================

ALTER TABLE `sistema_rh`.`batidas_ponto`
ADD COLUMN `batida_alterada` TINYINT(1) NOT NULL DEFAULT 0 AFTER `batida_foto_caminho`,
ADD COLUMN `batida_data_hora_original` DATETIME NULL DEFAULT NULL AFTER `batida_alterada`,
ADD COLUMN `batida_alterado_por_id` INT NULL DEFAULT NULL AFTER `batida_data_hora_original`,
ADD COLUMN `batida_data_alteracao` DATETIME NULL DEFAULT NULL AFTER `batida_alterado_por_id`;

-- Índice e FK para quem alterou (opcional, melhora consultas)
ALTER TABLE `sistema_rh`.`batidas_ponto`
ADD INDEX `batida_alterado_por_id_idx` (`batida_alterado_por_id` ASC),
ADD CONSTRAINT `fk_batida_alterado_por`
  FOREIGN KEY (`batida_alterado_por_id`)
  REFERENCES `sistema_rh`.`usuarios` (`usuario_id`)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
