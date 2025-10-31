-- 创建 multicenter_datasets 表
CREATE TABLE multicenter_datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner VARCHAR(255) NOT NULL,
    dataset_name VARCHAR(255) NOT NULL,
    description TEXT,
    visible_status ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PRIVATE',
    keyword VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expired_at DATETIME
)ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- 创建 AccessRequests 表
CREATE TABLE multicenter_datasets_accessrequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    requester VARCHAR(255) NOT NULL,
    reviewer VARCHAR(255), 
    requested_access_count INT DEFAULT 100, -- 申请访问次数，默认为100
    requested_deadline DATETIME, -- 申请的截止时间
    request_reason TEXT,
    request_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    review_comment TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME -- 审批时间，可以为空直到审批完成
)ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;


-- 创建 multicenter_datasets_asset_grants (数据资产授权表)
CREATE TABLE `multicenter_datasets_asset_grants` (
  `grant_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `asset_id` int(11) NOT NULL,
  `requester` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `access_count` int(11) DEFAULT '100',
  `deadline` datetime DEFAULT NULL,
  `grant_status` enum('GRANTED','REVOKED') DEFAULT 'GRANTED',
  `left_count` int(11) DEFAULT NULL COMMENT '剩余使用次数',
  PRIMARY KEY (`grant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4

CREATE TABLE multicenter_datasets_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    object VARCHAR(4096) NOT NULL
);
-- 为keyword字段创建索引以提高查询性能
CREATE INDEX idx_keyword ON multicenter_datasets_records(keyword);
-- 为unit字段创建索引以提高查询性能
CREATE INDEX idx_unit ON multicenter_datasets_records(unit);
