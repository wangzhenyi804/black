package com.blackad.backend.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.blackad.backend.dto.DashboardStatsDTO;
import com.blackad.backend.dto.StatsCodeSlotDTO;
import com.blackad.backend.dto.StatsQueryDTO;
import com.blackad.backend.dto.StatsTrendDTO;
import com.blackad.backend.entity.Stats;

import java.util.List;

public interface StatsService extends IService<Stats> {
    StatsTrendDTO getSummary(StatsQueryDTO query);
    List<StatsTrendDTO> getTrend(StatsQueryDTO query);
    IPage<StatsTrendDTO> getList(StatsQueryDTO query);
    IPage<StatsCodeSlotDTO> getCodeSlotStats(StatsQueryDTO query);
    DashboardStatsDTO getDashboardStats(Long userId);
}
