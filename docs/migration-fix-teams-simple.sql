-- Script SIMPLES de migração - Execute este primeiro
-- Este script limpa os dados inválidos antes de criar as constraints

-- 1. Limpar team_id inválidos em teacher_profiles
UPDATE `teacher_profiles` SET `team_id` = NULL WHERE `team_id` IS NOT NULL AND `team_id` NOT IN (SELECT `id` FROM `teams`);

-- 2. Limpar team_id inválidos em leader_profiles  
UPDATE `leader_profiles` SET `team_id` = NULL WHERE `team_id` IS NOT NULL AND `team_id` NOT IN (SELECT `id` FROM `teams`);

-- 3. Se a tabela teams não existir, criar vazia
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `shelter_id` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `IDX_teams_shelter_id` (`shelter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Data cleanup completed! Now restart the application.' AS result;

