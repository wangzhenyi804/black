-- 平台类型字段增量脚本
-- 需人工确认：生产环境执行前请确认维护窗口与历史数据默认值策略。

ALTER TABLE media
    ADD COLUMN platform_type VARCHAR(20) NULL COMMENT '平台类型: 360/baidu/google/sm';

ALTER TABLE code_slot
    ADD COLUMN platform_type VARCHAR(20) NULL COMMENT '平台类型: 360/baidu/google/sm';

CREATE INDEX idx_media_platform_type ON media(platform_type);
CREATE INDEX idx_code_slot_platform_type ON code_slot(platform_type);

-- 历史数据回填：
-- 1. 仅回填 platform_type 为空或空字符串的老数据，避免覆盖已经人工维护过的平台类型。
-- 2. 名称包含 360 的数据识别为 360；名称包含 bd 或 baidu 的数据识别为 baidu。
-- 3. 若名称同时命中 360 与 bd/baidu，按 360 优先处理；其余无法识别的数据保持为空，后续人工确认。
UPDATE media
SET platform_type = CASE
    WHEN LOWER(name) LIKE '%360%' THEN '360'
    WHEN LOWER(name) LIKE '%baidu%' OR LOWER(name) LIKE '%bd%' THEN 'baidu'
    ELSE platform_type
END
WHERE (platform_type IS NULL OR platform_type = '')
  AND (
      LOWER(name) LIKE '%360%'
      OR LOWER(name) LIKE '%baidu%'
      OR LOWER(name) LIKE '%bd%'
  );

UPDATE code_slot
SET platform_type = CASE
    WHEN LOWER(name) LIKE '%360%' THEN '360'
    WHEN LOWER(name) LIKE '%baidu%' OR LOWER(name) LIKE '%bd%' THEN 'baidu'
    ELSE platform_type
END
WHERE (platform_type IS NULL OR platform_type = '')
  AND (
      LOWER(name) LIKE '%360%'
      OR LOWER(name) LIKE '%baidu%'
      OR LOWER(name) LIKE '%bd%'
  );

-- 回填结果核对（执行后手动查看）：
SELECT platform_type, COUNT(*) AS media_count
FROM media
GROUP BY platform_type;

SELECT platform_type, COUNT(*) AS code_slot_count
FROM code_slot
GROUP BY platform_type;
