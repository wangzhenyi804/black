package com.blackad.backend.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class StatsCodeSlotDTO {
    @com.fasterxml.jackson.annotation.JsonProperty("codeSlotId")
    private Long codeSlotId;
    @com.fasterxml.jackson.annotation.JsonProperty("codeSlotName")
    private String codeSlotName;
    @com.fasterxml.jackson.annotation.JsonProperty("mediaName")
    private String mediaName;
    private Long impressions;
    private Long clicks;
    private BigDecimal revenue; // 分成前收入 (对应表格中的收入)
    private BigDecimal afterSharingRevenue; // 分成后收入 (收入 * 系数)
    private Double ctr;
    private BigDecimal ecpm;
    private BigDecimal acp;
    private BigDecimal ratio; // 分成系数
}
