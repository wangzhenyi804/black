package com.blackad.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("code_slot")
public class CodeSlot implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long mediaId;
    private String codeSlotId; // Logical ID (e.g., from external system)
    private String name;
    private String type; // Old type, maybe map to displayType?
    private String terminal; // "H5", "PC"
    private String displayType; // "Fixed", "Float", "Interstitial"
    private String adType; // "Feed", "ImageText", "Search"
    private String adForm; // "NativeThumb", "NativeText", etc.
    private Integer ratio; // Aspect ratio height part (e.g., 6 for 20:6)
    private String styleType; // "Default", "Custom"
    private String note;
    private String imageUrl;
    
    private Integer width;
    private Integer height;
    private Boolean isShielding;
    private String status; // "ACTIVE", "PAUSED", "DELETED"
    private String codeContent;
    private java.math.BigDecimal revenueRatio; // 分成系数
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
