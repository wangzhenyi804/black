package com.blackad.backend.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

@Data
@TableName("stats")
public class Stats implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private Long userId;
    private LocalDate date;
    private Long mediaId;
    private Long codeSlotId;
    private Long impressions;
    private Long clicks;
    private BigDecimal ratio;      // 系数 (默认1.0)
    private BigDecimal revenue;    // 收入 (对应表格中的收入，即分成前收入)
    
    @TableField(exist = false)
    private BigDecimal afterSharingRevenue; // 分成后收入
    
    public BigDecimal getAfterSharingRevenue() {
        if (revenue != null && ratio != null) {
            return revenue.multiply(ratio);
        }
        return BigDecimal.ZERO;
    }
    
    private String extraData;      // 存储 Excel 中的其他冗余数据 (JSON)
    private LocalDateTime createTime;
}
