package com.blackad.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DashboardStatsDTO {
    private BigDecimal yesterdayRevenue;    // 昨日分成前收入
    private BigDecimal yesterdayAfterSharingRevenue; // 昨日分成后收入
    
    private BigDecimal last7DaysRevenue;    // 前7日分成前收入
    private BigDecimal last7DaysAfterSharingRevenue; // 前7日分成后收入
    
    private BigDecimal thisMonthRevenue;    // 本月分成前收入
    private BigDecimal thisMonthAfterSharingRevenue; // 本月分成后收入
    
    private BigDecimal last7DaysAvgRevenue; // 最近7日日均分成后收入 (默认展示分成后)
    
    // Quick summary fields
    private Long activeCodeSlots;           // 活跃代码位
    private Long pendingAudit;              // 待审核
    private Double avgCtr;                  // 平均点击率
}
