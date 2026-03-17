package com.blackad.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StatsTrendDTO {
    private LocalDate date;
    private Long impressions;
    private Long clicks;
    private BigDecimal revenue; // 分成前收入 (对应表格中的收入)
    private BigDecimal afterSharingRevenue; // 分成后收入 (收入 * 系数)
    private Double ctr;
    private BigDecimal ecpm;
    private BigDecimal acp;
    private BigDecimal ratio;
    private BigDecimal dailyAvgRevenue; // For summary only
}
