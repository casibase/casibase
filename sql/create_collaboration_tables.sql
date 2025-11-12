-- 创建协同诊疗请求表
CREATE TABLE IF NOT EXISTS collaboration_request (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(100) NOT NULL UNIQUE,
    initiator_doctor_id VARCHAR(100) NOT NULL,
    initiator_doctor_name VARCHAR(100) NOT NULL,
    initiator_hospital VARCHAR(200) NOT NULL,
    patient_hash_id VARCHAR(200) NOT NULL,
    patient_name VARCHAR(100),
    target_hospitals TEXT NOT NULL,
    target_doctors TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_initiator_doctor_id (initiator_doctor_id),
    INDEX idx_patient_hash_id (patient_hash_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='协同诊疗请求表';

-- 创建诊疗意见表
CREATE TABLE IF NOT EXISTS diagnosis_opinion (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    opinion_id VARCHAR(100) NOT NULL UNIQUE,
    collaboration_req_id VARCHAR(100) NOT NULL,
    doctor_id VARCHAR(100) NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    opinion TEXT NOT NULL,
    diagnosis TEXT,
    treatment_suggestion TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_collaboration_req_id (collaboration_req_id),
    INDEX idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='诊疗意见表（同一医生可提交多条意见）';


