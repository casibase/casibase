-- 为协同诊疗请求表添加target_doctors字段
-- 如果表已存在，使用此SQL添加新字段
-- 注意：如果target_doctors列已存在，执行此SQL会报错，可以忽略

ALTER TABLE collaboration_request 
ADD COLUMN target_doctors TEXT COMMENT 'JSON array of doctor IDs (owner/name format)' 
AFTER target_hospitals;

-- 如果需要检查列是否存在再添加，可以使用以下存储过程：
-- DELIMITER $$
-- CREATE PROCEDURE AddTargetDoctorsColumnIfNotExists()
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
--         WHERE TABLE_SCHEMA = DATABASE() 
--         AND TABLE_NAME = 'collaboration_request' 
--         AND COLUMN_NAME = 'target_doctors'
--     ) THEN
--         ALTER TABLE collaboration_request 
--         ADD COLUMN target_doctors TEXT COMMENT 'JSON array of doctor IDs (owner/name format)' 
--         AFTER target_hospitals;
--     END IF;
-- END$$
-- DELIMITER ;
-- CALL AddTargetDoctorsColumnIfNotExists();
-- DROP PROCEDURE AddTargetDoctorsColumnIfNotExists;

