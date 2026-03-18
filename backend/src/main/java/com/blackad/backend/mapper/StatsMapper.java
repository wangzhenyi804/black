package com.blackad.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blackad.backend.dto.StatsCodeSlotDTO;
import com.blackad.backend.dto.StatsQueryDTO;
import com.blackad.backend.dto.StatsTrendDTO;
import com.blackad.backend.entity.Stats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface StatsMapper extends BaseMapper<Stats> {

    @Select("<script>" +
            "SELECT " +
            "   MAX(s.code_slot_id) as codeSlotId, " +
            "   cs.name as codeSlotName, " +
            "   SUM(s.impressions) as impressions, " +
            "   SUM(s.clicks) as clicks, " +
            "   SUM(s.revenue) as revenue, " +
            "   MAX(cs.revenue_ratio) as ratio, " +
            "   SUM(s.revenue * IFNULL(cs.revenue_ratio, 1.0)) as afterSharingRevenue, " +
            "   IFNULL(SUM(s.clicks) / NULLIF(SUM(s.impressions), 0), 0) as ctr, " +
            "   IFNULL(SUM(s.revenue) * 1000 / NULLIF(SUM(s.impressions), 0), 0) as ecpm, " +
            "   IFNULL(SUM(s.revenue) / NULLIF(SUM(s.clicks), 0), 0) as acp " +
            "FROM stats s " +
            "LEFT JOIN code_slot cs ON s.code_slot_id = cs.id " +
            "WHERE 1=1 " +
            "<if test='query.startDate != null'> AND s.date &gt;= #{query.startDate} </if>" +
            "<if test='query.endDate != null'> AND s.date &lt;= #{query.endDate} </if>" +
            "<if test='query.codeSlotId != null'> AND s.code_slot_id = #{query.codeSlotId} </if>" +
            "<if test='query.codeSlotName != null and query.codeSlotName != \"\"'> AND cs.name LIKE CONCAT('%', #{query.codeSlotName}, '%') </if>" +
            "<if test='query.terminal != null and query.terminal != \"\" and query.terminal != \"全部\"'> AND cs.terminal = #{query.terminal} </if>" +
            "<if test='query.type != null and query.type != \"\" and query.type != \"全部\"'> AND cs.type = #{query.type} </if>" +
            "<if test='query.userId != null'> AND s.user_id = #{query.userId} </if>" +
            "GROUP BY cs.name " +
            "ORDER BY CAST(codeSlotId AS CHAR) ASC" +
            "</script>")
    IPage<StatsCodeSlotDTO> selectCodeSlotStats(Page<?> page, @Param("query") StatsQueryDTO query);

    @Select("<script>" +
            "SELECT " +
            "   SUM(s.impressions) as impressions, " +
            "   SUM(s.clicks) as clicks, " +
            "   SUM(s.revenue) as revenue, " +
            "   AVG(IFNULL(cs.revenue_ratio, 1.0)) as ratio, " +
            "   SUM(s.revenue * IFNULL(cs.revenue_ratio, 1.0)) as afterSharingRevenue, " +
            "   IFNULL(SUM(s.clicks) / NULLIF(SUM(s.impressions), 0), 0) as ctr, " +
            "   IFNULL(SUM(s.revenue) * 1000 / NULLIF(SUM(s.impressions), 0), 0) as ecpm, " +
            "   IFNULL(SUM(s.revenue) / NULLIF(SUM(s.clicks), 0), 0) as acp, " +
            "   IFNULL(SUM(s.revenue * IFNULL(cs.revenue_ratio, 1.0)) / NULLIF(DATEDIFF(MAX(s.date), MIN(s.date)) + 1, 0), 0) as dailyAvgRevenue " +
            "FROM stats s " +
            "LEFT JOIN code_slot cs ON s.code_slot_id = cs.id " +
            "WHERE 1=1 " +
            "<if test='query.startDate != null'> AND s.date &gt;= #{query.startDate} </if>" +
            "<if test='query.endDate != null'> AND s.date &lt;= #{query.endDate} </if>" +
            "<if test='query.codeSlotId != null'> AND s.code_slot_id = #{query.codeSlotId} </if>" +
            "<if test='query.codeSlotName != null and query.codeSlotName != \"\"'> AND cs.name LIKE CONCAT('%', #{query.codeSlotName}, '%') </if>" +
            "<if test='query.terminal != null and query.terminal != \"\" and query.terminal != \"全部\"'> AND cs.terminal = #{query.terminal} </if>" +
            "<if test='query.type != null and query.type != \"\" and query.type != \"全部\"'> AND cs.type = #{query.type} </if>" +
            "<if test='query.userId != null'> AND s.user_id = #{query.userId} </if>" +
            "</script>")
    StatsTrendDTO selectSummary(@Param("query") StatsQueryDTO query);

    @Select("<script>" +
            "SELECT " +
            "   s.date, " +
            "   SUM(s.impressions) as impressions, " +
            "   SUM(s.clicks) as clicks, " +
            "   SUM(s.revenue) as revenue, " +
            "   SUM(s.revenue * IFNULL(cs.revenue_ratio, 1.0)) as afterSharingRevenue, " +
            "   IFNULL(SUM(s.clicks) / NULLIF(SUM(s.impressions), 0), 0) as ctr, " +
            "   IFNULL(SUM(s.revenue) * 1000 / NULLIF(SUM(s.impressions), 0), 0) as ecpm, " +
            "   IFNULL(SUM(s.revenue) / NULLIF(SUM(s.clicks), 0), 0) as acp " +
            "FROM stats s " +
            "LEFT JOIN code_slot cs ON s.code_slot_id = cs.id " +
            "WHERE 1=1 " +
            "<if test='query.startDate != null'> AND s.date &gt;= #{query.startDate} </if>" +
            "<if test='query.endDate != null'> AND s.date &lt;= #{query.endDate} </if>" +
            "<if test='query.codeSlotId != null'> AND s.code_slot_id = #{query.codeSlotId} </if>" +
            "<if test='query.codeSlotName != null and query.codeSlotName != \"\"'> AND cs.name LIKE CONCAT('%', #{query.codeSlotName}, '%') </if>" +
            "<if test='query.terminal != null and query.terminal != \"\" and query.terminal != \"全部\"'> AND cs.terminal = #{query.terminal} </if>" +
            "<if test='query.type != null and query.type != \"\" and query.type != \"全部\"'> AND cs.type = #{query.type} </if>" +
            "<if test='query.userId != null'> AND s.user_id = #{query.userId} </if>" +
            "GROUP BY s.date " +
            "ORDER BY s.date ASC" +
            "</script>")
    List<StatsTrendDTO> selectTrend(@Param("query") StatsQueryDTO query);

    @Select("<script>" +
            "SELECT " +
            "   s.date, " +
            "   SUM(s.impressions) as impressions, " +
            "   SUM(s.clicks) as clicks, " +
            "   SUM(s.revenue) as revenue, " +
            "   SUM(s.revenue * IFNULL(cs.revenue_ratio, 1.0)) as afterSharingRevenue, " +
            "   IFNULL(SUM(s.clicks) / NULLIF(SUM(s.impressions), 0), 0) as ctr, " +
            "   IFNULL(SUM(s.revenue) * 1000 / NULLIF(SUM(s.impressions), 0), 0) as ecpm, " +
            "   IFNULL(SUM(s.revenue) / NULLIF(SUM(s.clicks), 0), 0) as acp " +
            "FROM stats s " +
            "LEFT JOIN code_slot cs ON s.code_slot_id = cs.id " +
            "WHERE 1=1 " +
            "<if test='query.startDate != null'> AND s.date &gt;= #{query.startDate} </if>" +
            "<if test='query.endDate != null'> AND s.date &lt;= #{query.endDate} </if>" +
            "<if test='query.codeSlotId != null'> AND s.code_slot_id = #{query.codeSlotId} </if>" +
            "<if test='query.codeSlotName != null and query.codeSlotName != \"\"'> AND cs.name LIKE CONCAT('%', #{query.codeSlotName}, '%') </if>" +
            "<if test='query.terminal != null and query.terminal != \"\" and query.terminal != \"全部\"'> AND cs.terminal = #{query.terminal} </if>" +
            "<if test='query.type != null and query.type != \"\" and query.type != \"全部\"'> AND cs.type = #{query.type} </if>" +
            "<if test='query.userId != null'> AND s.user_id = #{query.userId} </if>" +
            "GROUP BY s.date " +
            "ORDER BY s.date DESC" +
            "</script>")
    IPage<StatsTrendDTO> selectStatsList(Page<?> page, @Param("query") StatsQueryDTO query);
}
