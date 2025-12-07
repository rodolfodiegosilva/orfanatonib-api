-- Script COMPLETO de migração - Execute este para garantir que tudo está correto

-- 1. Garantir que a tabela teams existe com a estrutura correta
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `shelter_id` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `IDX_teams_shelter_id` (`shelter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Limpar dados inválidos ANTES de criar constraints
UPDATE `teacher_profiles` SET `team_id` = NULL WHERE `team_id` IS NOT NULL AND `team_id` NOT IN (SELECT `id` FROM `teams`);
UPDATE `leader_profiles` SET `team_id` = NULL WHERE `team_id` IS NOT NULL AND `team_id` NOT IN (SELECT `id` FROM `teams`);

-- 3. Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- 4. Remover foreign keys antigas (ignorar erros se não existirem)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
   WHERE CONSTRAINT_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'teacher_profiles' 
   AND CONSTRAINT_NAME = 'FK_87921cf0156664d54c1a2b26b86') > 0,
  'ALTER TABLE `teacher_profiles` DROP FOREIGN KEY `FK_87921cf0156664d54c1a2b26b86`',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
   WHERE CONSTRAINT_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'teacher_profiles' 
   AND CONSTRAINT_NAME = 'FK_teacher_profiles_team') > 0,
  'ALTER TABLE `teacher_profiles` DROP FOREIGN KEY `FK_teacher_profiles_team`',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
   WHERE CONSTRAINT_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'leader_profiles' 
   AND CONSTRAINT_NAME = 'FK_leader_profiles_team') > 0,
  'ALTER TABLE `leader_profiles` DROP FOREIGN KEY `FK_leader_profiles_team`',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
   WHERE CONSTRAINT_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'teams' 
   AND CONSTRAINT_NAME = 'FK_teams_shelter') > 0,
  'ALTER TABLE `teams` DROP FOREIGN KEY `FK_teams_shelter`',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- 5. Garantir que as colunas existem
SET @exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'teacher_profiles' 
              AND COLUMN_NAME = 'team_id');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `teacher_profiles` ADD COLUMN `team_id` VARCHAR(36) NULL', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM information_schema.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'leader_profiles' 
              AND COLUMN_NAME = 'team_id');
SET @sql = IF(@exist = 0, 
  'ALTER TABLE `leader_profiles` ADD COLUMN `team_id` VARCHAR(36) NULL', 
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Criar foreign key para teams -> shelters PRIMEIRO
SET @exist = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
              WHERE CONSTRAINT_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'teams' 
              AND CONSTRAINT_NAME = 'FK_teams_shelter');
SET @sql = IF(@exist = 0,
  'ALTER TABLE `teams` ADD CONSTRAINT `FK_teams_shelter` FOREIGN KEY (`shelter_id`) REFERENCES `shelters`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Criar foreign keys para teacher_profiles e leader_profiles
SET @exist = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
              WHERE CONSTRAINT_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'teacher_profiles' 
              AND CONSTRAINT_NAME = 'FK_teacher_profiles_team');
SET @sql = IF(@exist = 0,
  'ALTER TABLE `teacher_profiles` ADD CONSTRAINT `FK_teacher_profiles_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
              WHERE CONSTRAINT_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'leader_profiles' 
              AND CONSTRAINT_NAME = 'FK_leader_profiles_team');
SET @sql = IF(@exist = 0,
  'ALTER TABLE `leader_profiles` ADD CONSTRAINT `FK_leader_profiles_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Criar índices para melhor performance (ignorar se já existirem)
SET @exist = (SELECT COUNT(*) FROM information_schema.STATISTICS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'teacher_profiles' 
              AND INDEX_NAME = 'IDX_teacher_profiles_team_id');
SET @sql = IF(@exist = 0,
  'CREATE INDEX `IDX_teacher_profiles_team_id` ON `teacher_profiles`(`team_id`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM information_schema.STATISTICS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'leader_profiles' 
              AND INDEX_NAME = 'IDX_leader_profiles_team_id');
SET @sql = IF(@exist = 0,
  'CREATE INDEX `IDX_leader_profiles_team_id` ON `leader_profiles`(`team_id`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully! You can now start the application.' AS result;
