-- Script de migração para corrigir foreign keys de teams
-- Execute este script ANTES de iniciar a aplicação com a nova estrutura

-- 1. Criar a tabela teams se não existir
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `shelter_id` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `IDX_teams_shelter_id` (`shelter_id`),
  CONSTRAINT `FK_teams_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Limpar dados inválidos em teacher_profiles
-- Definir team_id como NULL para todos os registros que não têm um team válido
UPDATE `teacher_profiles` 
SET `team_id` = NULL 
WHERE `team_id` IS NOT NULL 
  AND `team_id` NOT IN (SELECT `id` FROM `teams`);

-- 3. Limpar dados inválidos em leader_profiles
-- Definir team_id como NULL para todos os registros que não têm um team válido
UPDATE `leader_profiles` 
SET `team_id` = NULL 
WHERE `team_id` IS NOT NULL 
  AND `team_id` NOT IN (SELECT `id` FROM `teams`);

-- 4. Remover a coluna shelter_id se ainda existir em teacher_profiles
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'teacher_profiles' 
               AND COLUMN_NAME = 'shelter_id');
SET @sqlstmt := IF(@exist > 0, 
  'ALTER TABLE `teacher_profiles` DROP FOREIGN KEY IF EXISTS `FK_teacher_profiles_shelter`, DROP COLUMN `shelter_id`', 
  'SELECT "Column shelter_id does not exist in teacher_profiles"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Remover a coluna shelter_id se ainda existir em leader_profiles
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'leader_profiles' 
               AND COLUMN_NAME = 'shelter_id');
SET @sqlstmt := IF(@exist > 0, 
  'ALTER TABLE `leader_profiles` DROP FOREIGN KEY IF EXISTS `FK_leader_profiles_shelter`, DROP COLUMN `shelter_id`', 
  'SELECT "Column shelter_id does not exist in leader_profiles"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Adicionar coluna team_id em teacher_profiles se não existir
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'teacher_profiles' 
               AND COLUMN_NAME = 'team_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `teacher_profiles` ADD COLUMN `team_id` VARCHAR(36) NULL', 
  'SELECT "Column team_id already exists in teacher_profiles"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Adicionar coluna team_id em leader_profiles se não existir
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'leader_profiles' 
               AND COLUMN_NAME = 'team_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `leader_profiles` ADD COLUMN `team_id` VARCHAR(36) NULL', 
  'SELECT "Column team_id already exists in leader_profiles"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Remover foreign keys antigas se existirem
ALTER TABLE `teacher_profiles` DROP FOREIGN KEY IF EXISTS `FK_87921cf0156664d54c1a2b26b86`;
ALTER TABLE `leader_profiles` DROP FOREIGN KEY IF EXISTS `FK_leader_profiles_team`;

-- 9. Adicionar foreign keys corretas
ALTER TABLE `teacher_profiles` 
  ADD CONSTRAINT `FK_teacher_profiles_team` 
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;

ALTER TABLE `leader_profiles` 
  ADD CONSTRAINT `FK_leader_profiles_team` 
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;

-- 10. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS `IDX_teacher_profiles_team_id` ON `teacher_profiles`(`team_id`);
CREATE INDEX IF NOT EXISTS `IDX_leader_profiles_team_id` ON `leader_profiles`(`team_id`);

SELECT 'Migration completed successfully!' AS result;

