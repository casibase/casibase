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
);

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
);


-- 创建 multicenter_datasets_assetgrants (数据资产授权表)
CREATE TABLE multicenter_datasets_assetgrants (
    grant_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT, -- -1代表主动授权
    asset_id INT NOT NULL,
    requester VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    access_count INT DEFAULT 100, -- 申请访问次数，默认为100
    deadline DATETIME, -- 申请的截止时间
    grant_status ENUM('GRANTED', 'REVOKED') DEFAULT 'GRANTED'
);
