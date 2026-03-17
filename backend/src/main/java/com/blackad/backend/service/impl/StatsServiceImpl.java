package com.blackad.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.blackad.backend.dto.DashboardStatsDTO;
import com.blackad.backend.dto.StatsCodeSlotDTO;
import com.blackad.backend.dto.StatsQueryDTO;
import com.blackad.backend.dto.StatsTrendDTO;
import com.blackad.backend.entity.Stats;
import com.blackad.backend.mapper.StatsMapper;
import com.blackad.backend.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatsServiceImpl extends ServiceImpl<StatsMapper, Stats> implements StatsService {

    @Autowired
    private StatsMapper statsMapper;

    @Autowired
    private com.blackad.backend.service.CodeSlotService codeSlotService;

    @Autowired
    private com.blackad.backend.service.MediaService mediaService;

    @Override
    public StatsTrendDTO getSummary(StatsQueryDTO query) {
        // We will delegate to mapper xml for complex aggregation
        return statsMapper.selectSummary(query);
    }

    @Override
    public List<StatsTrendDTO> getTrend(StatsQueryDTO query) {
        return statsMapper.selectTrend(query);
    }

    @Override
    public IPage<StatsTrendDTO> getList(StatsQueryDTO query) {
        Page<StatsTrendDTO> page = new Page<>(query.getPage(), query.getSize());
        return statsMapper.selectStatsList(page, query);
    }

    @Override
    public IPage<StatsCodeSlotDTO> getCodeSlotStats(StatsQueryDTO query) {
        Page<StatsCodeSlotDTO> page = new Page<>(query.getPage(), query.getSize());
        return statsMapper.selectCodeSlotStats(page, query);
    }

    @Override
    public DashboardStatsDTO getDashboardStats(Long userId) {
        DashboardStatsDTO dashboard = new DashboardStatsDTO();
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate last7DaysStart = today.minusDays(7);
        LocalDate thisMonthStart = today.with(TemporalAdjusters.firstDayOfMonth());

        // Yesterday Revenue
        StatsQueryDTO yestQuery = new StatsQueryDTO();
        yestQuery.setUserId(userId);
        yestQuery.setStartDate(yesterday);
        yestQuery.setEndDate(yesterday);
        StatsTrendDTO yestSummary = statsMapper.selectSummary(yestQuery);
        dashboard.setYesterdayRevenue(getSafeBigDecimal(yestSummary != null ? yestSummary.getRevenue() : BigDecimal.ZERO));
        dashboard.setYesterdayAfterSharingRevenue(getSafeBigDecimal(yestSummary != null ? yestSummary.getAfterSharingRevenue() : BigDecimal.ZERO));

        // Last 7 Days Revenue (excluding today usually, but the requirement says "前7日")
        // "前7日" often means today-7 to yesterday.
        StatsQueryDTO last7Query = new StatsQueryDTO();
        last7Query.setUserId(userId);
        last7Query.setStartDate(last7DaysStart);
        last7Query.setEndDate(yesterday);
        StatsTrendDTO last7Summary = statsMapper.selectSummary(last7Query);
        BigDecimal last7Revenue = getSafeBigDecimal(last7Summary != null ? last7Summary.getRevenue() : BigDecimal.ZERO);
        BigDecimal last7AfterSharingRevenue = getSafeBigDecimal(last7Summary != null ? last7Summary.getAfterSharingRevenue() : BigDecimal.ZERO);
        dashboard.setLast7DaysRevenue(last7Revenue);
        dashboard.setLast7DaysAfterSharingRevenue(last7AfterSharingRevenue);
        dashboard.setLast7DaysAvgRevenue(last7AfterSharingRevenue.divide(new BigDecimal(7), 2, RoundingMode.HALF_UP));

        // This Month Revenue
        StatsQueryDTO monthQuery = new StatsQueryDTO();
        monthQuery.setUserId(userId);
        monthQuery.setStartDate(thisMonthStart);
        monthQuery.setEndDate(today);
        StatsTrendDTO monthSummary = statsMapper.selectSummary(monthQuery);
        dashboard.setThisMonthRevenue(getSafeBigDecimal(monthSummary != null ? monthSummary.getRevenue() : BigDecimal.ZERO));
        dashboard.setThisMonthAfterSharingRevenue(getSafeBigDecimal(monthSummary != null ? monthSummary.getAfterSharingRevenue() : BigDecimal.ZERO));

        // Quick data summary (source: code slots and stats)
        // 1. Active Code Slots (those that have impressions in the last 7 days)
        QueryWrapper<Stats> activeSlotWrapper = new QueryWrapper<>();
        activeSlotWrapper.select("DISTINCT code_slot_id")
                .ge("date", last7DaysStart)
                .le("date", yesterday);
        if (userId != null) {
            activeSlotWrapper.eq("user_id", userId);
        }
        dashboard.setActiveCodeSlots((long) this.list(activeSlotWrapper).size());

        // 2. Pending Audit (media that are pending)
        QueryWrapper<com.blackad.backend.entity.Media> pendingMediaWrapper = new QueryWrapper<>();
        pendingMediaWrapper.eq("status", "PENDING");
        if (userId != null) {
            pendingMediaWrapper.eq("user_id", userId);
        }
        dashboard.setPendingAudit(mediaService.count(pendingMediaWrapper));

        // 3. Avg CTR (last 7 days)
        dashboard.setAvgCtr(last7Summary != null && last7Summary.getCtr() != null ? last7Summary.getCtr() : 0.0);

        return dashboard;
    }

    private BigDecimal getSafeBigDecimal(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }
}
