-- 智能数据同步工作台相关表结构变更

-- 1. 创建 OCR 映射记忆表
CREATE TABLE IF NOT EXISTS `ocr_mapping_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `original_text` VARCHAR(255) NOT NULL COMMENT 'OCR 识别到的原始文本',
    `target_slot_name` VARCHAR(255) NOT NULL COMMENT '关联的系统逻辑代码位名称',
    `last_used_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后一次使用时间',
    UNIQUE KEY `uk_original_text` (`original_text`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OCR 名称映射记忆表';

-- 2. 如果 stats 表没有 extra_data 字段，可以考虑添加（可选，用于存储原始识别结果快照）
-- ALTER TABLE `stats` ADD COLUMN `ocr_snapshot` TEXT COMMENT 'OCR 识别原始数据快照' AFTER `extra_data`;
