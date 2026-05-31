-- 平台类型字段增量脚本
-- 需人工确认：生产环境执行前请确认维护窗口与历史数据默认值策略。

ALTER TABLE media
    ADD COLUMN platform_type VARCHAR(20) NULL COMMENT '平台类型: 360/baidu/google/sm';

ALTER TABLE code_slot
    ADD COLUMN platform_type VARCHAR(20) NULL COMMENT '平台类型: 360/baidu/google/sm';

CREATE INDEX idx_media_platform_type ON media(platform_type);
CREATE INDEX idx_code_slot_platform_type ON code_slot(platform_type);

-- 可选历史数据回填，默认不执行。若业务确认默认平台，可按需打开并替换默认值。
-- UPDATE media SET platform_type = 'baidu' WHERE platform_type IS NULL;
-- UPDATE code_slot cs
-- LEFT JOIN media m ON cs.media_id = m.id
-- SET cs.platform_type = COALESCE(m.platform_type, 'baidu')
-- WHERE cs.platform_type IS NULL;
