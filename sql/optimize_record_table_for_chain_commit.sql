-- 针对千万级数据表的上链查询优化
-- 创建复合索引，大幅提升查询性能

-- ============================================
-- 重要：千万级数据表索引创建优化方案
-- ============================================

-- 方案一：在线创建索引（推荐，MySQL 5.6+）
-- 优点：不锁表，不影响业务，可以后台运行
-- 注意：创建时间可能较长（几十分钟到几小时），但不会阻塞读写操作
CREATE INDEX IF NOT EXISTS idx_need_commit_block_id 
ON record(need_commit, block, id)
ALGORITHM=INPLACE, LOCK=NONE;

-- 如果上面的语句报错（MySQL版本不支持），使用下面的语句：
-- CREATE INDEX IF NOT EXISTS idx_need_commit_block_id 
-- ON record(need_commit, block, id);

-- ============================================
-- 索引创建监控和优化建议
-- ============================================

-- 1. 查看索引创建进度（MySQL 5.7+）
-- SELECT * FROM performance_schema.events_stages_current 
-- WHERE event_name LIKE 'stage/innodb/alter%';

-- 2. 查看当前正在执行的索引创建操作
-- SHOW PROCESSLIST;

-- 3. 如果创建时间过长，可以：
--    a) 在低峰期创建（凌晨2-6点）
--    b) 使用 pt-online-schema-change 工具（Percona Toolkit）
--    c) 分批创建：先创建部分数据的分区索引

-- 4. 优化MySQL参数（创建索引前临时调整，创建后恢复）
-- SET GLOBAL innodb_online_alter_log_max_size = 1073741824;  -- 1GB
-- SET GLOBAL innodb_sort_buffer_size = 67108864;  -- 64MB

-- ============================================
-- 其他索引优化
-- ============================================

-- 2. 如果createdTime需要时间范围过滤，建议添加时间索引
-- 注意：如果createdTime是varchar类型，索引效果可能不佳
-- 建议：将createdTime改为DATETIME类型，或添加一个created_time_int字段存储时间戳
-- CREATE INDEX IF NOT EXISTS idx_created_time ON record(created_time);

-- 3. 如果经常需要按owner查询，确保owner索引存在（应该已经有了）
-- CREATE INDEX IF NOT EXISTS idx_owner ON record(owner);

-- ============================================
-- 索引创建后的验证和优化
-- ============================================

-- 4. 分析表统计信息，优化查询计划（索引创建后执行）
-- ANALYZE TABLE record;

-- 5. 查看索引使用情况（执行后检查）
-- EXPLAIN SELECT * FROM record WHERE need_commit = true AND block = '' ORDER BY id LIMIT 500;

-- 6. 查看索引大小和统计信息
-- SHOW INDEX FROM record WHERE Key_name = 'idx_need_commit_block_id';
