-- Active: 1758521065318@@192.168.0.229@3306@casibase
CREATE TABLE `cache_storage` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID，自增唯一标识',
  `cache_key` varchar(255) NOT NULL COMMENT '缓存的键值，用于唯一标识缓存数据',
  `cache_json` TEXT NOT NULL COMMENT '缓存的JSON数据，满足大JSON存储需求',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='缓存数据存储表，用于存储需要临时缓存的JSON格式数据';