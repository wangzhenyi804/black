package com.blackad.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * OCR 名称映射记忆实体
 */
@Data
@TableName("ocr_mapping_history")
public class OcrMappingHistory {
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * OCR 识别到的原始文本
     */
    private String originalText;

    /**
     * 关联的系统逻辑代码位名称
     */
    private String targetSlotName;

    /**
     * 最后一次使用时间
     */
    private LocalDateTime lastUsedAt;
}
