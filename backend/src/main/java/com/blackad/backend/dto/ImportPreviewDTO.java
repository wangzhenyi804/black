package com.blackad.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 导入预览行数据 DTO
 */
@Data
public class ImportPreviewDTO {
    private String originalText;      // OCR 识别到的原始名称
    private String codeSlotName;      // 匹配到的系统代码位名称
    private Long codeSlotId;          // 匹配到的系统代码位 ID (如果是待新建则为 null)
    private String mediaName;         // 媒体名称
    private Long mediaId;             // 媒体 ID
    private LocalDate date;           // 统计日期
    private Long impressions;         // 展现量
    private Long clicks;              // 点击量
    private BigDecimal revenue;       // 收入 (分成前)
    private BigDecimal ctr;           // 点击率 (小数)
    private BigDecimal ecpm;          // eCPM (计算得出)
    private BigDecimal acp;           // ACP (计算得出)
    
    // 状态标识
    private boolean isNewSlot;        // 是否是新代码位
    private boolean isNewMedia;       // 是否是新媒体
    private boolean hasConflict;      // 是否存在冲突 (如同一天已存在数据)
    private String statusMessage;     // 状态描述 (如 "已匹配", "待新建", "已存在")
}
