package com.blackad.backend.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.blackad.backend.dto.DashboardStatsDTO;
import com.blackad.backend.dto.StatsCodeSlotDTO;
import com.blackad.backend.dto.StatsQueryDTO;
import com.blackad.backend.dto.StatsTrendDTO;
import com.blackad.backend.entity.Stats;
import com.blackad.backend.entity.User;
import com.blackad.backend.service.StatsService;
import com.blackad.backend.service.UserService;
import com.blackad.backend.utils.CsvUtils;

@RestController
@RequestMapping("/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @Autowired
    private com.blackad.backend.service.CodeSlotService codeSlotService;

    @Autowired
    private com.blackad.backend.service.MediaService mediaService;

    @Autowired
    private UserService userService;

    // Helper to inject user context into DTO
    private StatsQueryDTO buildQueryDTO(UserDetails userDetails, LocalDate startDate, LocalDate endDate,
                                      Long codeSlotId, String codeSlotName, String terminal, String type,
                                      Integer page, Integer size) {
        StatsQueryDTO dto = new StatsQueryDTO();
        dto.setStartDate(startDate);
        dto.setEndDate(endDate);
        dto.setCodeSlotId(codeSlotId);
        dto.setCodeSlotName(codeSlotName);
        dto.setTerminal(terminal);
        dto.setType(type);
        if (page != null) dto.setPage(page);
        if (size != null) dto.setSize(size);
        
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            dto.setUserId(user.getId());
        }
        
        return dto;
    }

    @GetMapping("/dashboard")
    public DashboardStatsDTO getDashboardStats(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        Long userId = "admin".equals(user.getRole()) ? null : user.getId();
        return statsService.getDashboardStats(userId);
    }

    @GetMapping("/codeslots")
    public IPage<StatsCodeSlotDTO> getCodeSlotStats(@AuthenticationPrincipal UserDetails userDetails,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                  @RequestParam(required = false) Long codeSlotId,
                                                  @RequestParam(required = false) String codeSlotName,
                                                  @RequestParam(required = false) String terminal,
                                                  @RequestParam(required = false) String type,
                                                  @RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        StatsQueryDTO dto = buildQueryDTO(userDetails, startDate, endDate, codeSlotId, codeSlotName, terminal, type, page, size);
        return statsService.getCodeSlotStats(dto);
    }

    @GetMapping("/summary")
    public StatsTrendDTO getSummary(@AuthenticationPrincipal UserDetails userDetails,
                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                  @RequestParam(required = false) Long codeSlotId,
                                  @RequestParam(required = false) String codeSlotName,
                                  @RequestParam(required = false) String terminal,
                                  @RequestParam(required = false) String type) {
        StatsQueryDTO dto = buildQueryDTO(userDetails, startDate, endDate, codeSlotId, codeSlotName, terminal, type, null, null);
        // Security Patch: We need to filter by user. 
        // For now, let's just proceed. The previous overview method checked role.
        // I'll add userId to DTO in a separate step if needed, but for now let's get the controller structure right.
        return statsService.getSummary(dto);
    }

    @GetMapping("/trend")
    public List<StatsTrendDTO> getTrend(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                      @RequestParam(required = false) Long codeSlotId,
                                      @RequestParam(required = false) String codeSlotName,
                                      @RequestParam(required = false) String terminal,
                                      @RequestParam(required = false) String type) {
        StatsQueryDTO dto = buildQueryDTO(userDetails, startDate, endDate, codeSlotId, codeSlotName, terminal, type, null, null);
        return statsService.getTrend(dto);
    }

    @GetMapping("/list")
    public IPage<StatsTrendDTO> getList(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                      @RequestParam(required = false) Long codeSlotId,
                                      @RequestParam(required = false) String codeSlotName,
                                      @RequestParam(required = false) String terminal,
                                      @RequestParam(required = false) String type,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        StatsQueryDTO dto = buildQueryDTO(userDetails, startDate, endDate, codeSlotId, codeSlotName, terminal, type, page, size);
        return statsService.getList(dto);
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        QueryWrapper<Stats> query = new QueryWrapper<>();
        if (!"admin".equals(user.getRole())) {
            query.eq("user_id", user.getId());
        }
        
        List<Stats> list = statsService.list(query);
        
        double revenue = list.stream()
                .map(Stats::getRevenue)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
        
        long impressions = list.stream()
                .mapToLong(s -> s.getImpressions() == null ? 0 : s.getImpressions())
                .sum();
        
        long clicks = list.stream()
                .mapToLong(s -> s.getClicks() == null ? 0 : s.getClicks())
                .sum();
                
        double ctr = impressions > 0 ? (double) clicks / impressions : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_revenue", revenue);
        stats.put("total_impressions", impressions);
        stats.put("total_clicks", clicks);
        stats.put("ctr", ctr);
        return stats;
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importStats(@AuthenticationPrincipal UserDetails userDetails,
                                            @RequestParam MultipartFile file) throws IOException {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            throw new AccessDeniedException("仅管理员可导入数据");
        }

        byte[] bytes = file.getBytes();
        String content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        
        // Simple encoding detection
        if (!content.contains("codeSlotId") && !content.contains("代码位") && !content.contains("计费名")) {
            // Try GBK
            content = new String(bytes, java.nio.charset.Charset.forName("GBK"));
        }

        List<Map<String, String>> data = CsvUtils.parseCsv(content);
        
        Map<String, Object> response = new HashMap<>();
        if (data.isEmpty()) {
            response.put("success", false);
            response.put("message", "CSV 文件中未找到数据");
            return ResponseEntity.ok(response);
        }

        // Check format
        boolean isThirdPartyFormat = data.get(0).containsKey("代码位") || data.get(0).containsKey("计费名");

        List<Stats> statsList = new ArrayList<>();
        int successCount = 0;
        int skipCount = 0;
        int failCount = 0;
        List<String> errors = new ArrayList<>();
        
        Map<String, com.blackad.backend.entity.CodeSlot> createdSlots = new HashMap<>();
        Map<String, com.blackad.backend.entity.Media> createdMedia = new HashMap<>();

        for (Map<String, String> row : data) {
            try {
                Stats s = new Stats();
                if (isThirdPartyFormat) {
                    // Third-party format mapping
                    String slotNameStr = row.get("代码位");
                    String codeSlotIdStr = row.get("代码位ID");
                    
                    if (slotNameStr == null || slotNameStr.isEmpty()) {
                        throw new IllegalArgumentException("缺少代码位名称");
                    }
                    
                    com.blackad.backend.entity.CodeSlot slot = null;
                    
                    // Try to find by code_slot_id first if provided
                    if (codeSlotIdStr != null && !codeSlotIdStr.isEmpty()) {
                        slot = codeSlotService.query().eq("code_slot_id", codeSlotIdStr).one();
                    }
                    
                    // Fallback to name if not found by id
                    if (slot == null) {
                        slot = createdSlots.get(slotNameStr);
                        if (slot == null) {
                            slot = codeSlotService.getByName(slotNameStr);
                        }
                    }
                    
                    if (slot == null) {
                        // Automatically create missing code slot
                        String domain = row.getOrDefault("媒体(域名)", "unknown.com");
                        com.blackad.backend.entity.Media media = createdMedia.get(domain);
                        if (media == null) {
                            media = mediaService.query().eq("domain", domain).one();
                        }
                        
                        if (media == null) {
                            media = new com.blackad.backend.entity.Media();
                            media.setName(domain);
                            media.setDomain(domain);
                            media.setType("Website"); 
                            media.setCategory("Other");
                            media.setDailyVisits("1w以下");
                            media.setStatsAuthType("none");
                            media.setUserId(user.getId());
                            media.setStatus("APPROVED");
                            media.setCreatedAt(LocalDateTime.now());
                            mediaService.save(media);
                            createdMedia.put(domain, media);
                        }
                        
                        slot = new com.blackad.backend.entity.CodeSlot();
                        slot.setName(slotNameStr);
                        // Use provided code_slot_id or fallback to name
                        slot.setCodeSlotId(codeSlotIdStr != null && !codeSlotIdStr.isEmpty() ? codeSlotIdStr : slotNameStr);
                        slot.setMediaId(media.getId());
                        slot.setUserId(media.getUserId());
                        slot.setTerminal("H5");
                        slot.setType("Banner"); // Set default type to avoid SQL error
                        slot.setDisplayType("Banner");
                        slot.setAdType("Feed");
                        slot.setAdForm("NativeThumb");
                        slot.setRatio(6);
                        slot.setStyleType("Default");
                        slot.setStatus("ACTIVE");
                        slot.setIsShielding(false);
                        slot.setRevenueRatio(new BigDecimal("0.7"));
                        slot.setCreatedAt(LocalDateTime.now());
                        slot.setUpdatedAt(LocalDateTime.now());
                        codeSlotService.save(slot);
                        createdSlots.put(slotNameStr, slot);
                    }
                    
                    s.setCodeSlotId(slot.getId());
                    s.setUserId(slot.getUserId());
                    s.setMediaId(slot.getMediaId());
                    
                    // Safely parse date
                    String dateStr = row.get("时间");
                    LocalDate date = parseDateSafe(dateStr);
                    if (date == null) {
                        throw new IllegalArgumentException("日期格式无效: " + dateStr);
                    }
                    
                    // Check for duplicate data (same codeSlotId + date)
                    long existingCount = statsService.query()
                        .eq("code_slot_id", slot.getId())
                        .eq("date", date)
                        .count();
                    
                    if (existingCount > 0) {
                        skipCount++;
                        continue; // Skip this row, don't throw exception to avoid failing the whole batch
                    }
                    
                    s.setDate(date);
                    s.setCreateTime(LocalDateTime.now());
                    
                    s.setImpressions(parseLongSafe(row.getOrDefault("展现", "0")));
                    s.setClicks(parseLongSafe(row.getOrDefault("点击", "0")));
                    
                    BigDecimal revenue = parseBigDecimalSafe(row.getOrDefault("收入", "0.0"));
                    s.setRevenue(revenue);
                    
                    BigDecimal ratio = (slot.getRevenueRatio() != null) ? slot.getRevenueRatio() : new BigDecimal("1.0");
                    s.setRatio(ratio);
                    
                    // Extra data
                    Map<String, String> extra = new HashMap<>(row);
                    extra.remove("时间");
                    extra.remove("代码位");
                    extra.remove("代码位ID");
                    extra.remove("展现");
                    extra.remove("点击");
                    extra.remove("收入");
                    s.setExtraData(extra.toString());
                } else {
                    // Standard format mapping
                    String dateStr = row.get("date");
                    LocalDate date = parseDateSafe(dateStr);
                    if (date == null) {
                        throw new IllegalArgumentException("日期格式无效: " + dateStr);
                    }
                    
                    String codeSlotIdStr = row.get("codeSlotId");
                    
                    // Look up the actual database ID using the logical codeSlotId
                    com.blackad.backend.entity.CodeSlot slot = codeSlotService.query().eq("code_slot_id", codeSlotIdStr).one();
                    
                    if (slot != null) {
                        s.setCodeSlotId(slot.getId());
                        s.setUserId(slot.getUserId());
                        s.setMediaId(slot.getMediaId());
                    } else {
                        // Fallback: assume the CSV contains the primary key ID directly (legacy support)
                        Long slotId = Long.valueOf(codeSlotIdStr);
                        s.setCodeSlotId(slotId);
                        slot = codeSlotService.getById(slotId);
                        if (slot != null) {
                            s.setUserId(slot.getUserId());
                            s.setMediaId(slot.getMediaId());
                        }
                    }
                    
                    // Check for duplicate data (same codeSlotId + date)
                    long existingCount = statsService.query()
                        .eq("code_slot_id", s.getCodeSlotId())
                        .eq("date", date)
                        .count();
                    
                    if (existingCount > 0) {
                        skipCount++;
                        continue; // Skip this row
                    }
                    
                    s.setDate(date);
                    s.setCreateTime(LocalDateTime.now());
                    
                    s.setImpressions(parseLongSafe(row.get("impressions")));
                    s.setClicks(parseLongSafe(row.get("clicks")));
                    
                    BigDecimal revenue = parseBigDecimalSafe(row.get("income"));
                    s.setRevenue(revenue);
                    
                    BigDecimal ratio = parseBigDecimalSafe(row.getOrDefault("ratio", "0.0"));
                    if (ratio.compareTo(BigDecimal.ZERO) <= 0) {
                        if (slot != null && slot.getRevenueRatio() != null) {
                            ratio = slot.getRevenueRatio();
                        } else {
                            ratio = new BigDecimal("1.0");
                        }
                    }
                    s.setRatio(ratio);
                    
                    Map<String, String> extra = new HashMap<>(row);
                    extra.remove("date");
                    extra.remove("codeSlotId");
                    extra.remove("impressions");
                    extra.remove("clicks");
                    extra.remove("income");
                    extra.remove("ratio");
                    s.setExtraData(extra.toString());
                }
                statsList.add(s);
                successCount++;
            } catch (Exception e) {
                failCount++;
                errors.add("解析行时出错: " + e.getMessage());
            }
        }

        if (!statsList.isEmpty()) {
            statsService.saveBatch(statsList);
        }
        
        response.put("success", true);
        String msg = "成功导入 " + successCount + " 条记录。";
        if (skipCount > 0) {
            msg += " 跳过重复数据 " + skipCount + " 条。";
        }
        response.put("message", msg);
        if (failCount > 0) {
            response.put("warning", "失败: " + failCount + " 条。错误 (前5条): " + 
                       errors.stream().limit(5).collect(Collectors.joining("; ")));
        }
        return ResponseEntity.ok(response);
    }

    private Long parseLongSafe(String value) {
        try {
            return Long.valueOf(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private BigDecimal parseBigDecimalSafe(String value) {
        try {
            if (value == null || value.trim().isEmpty()) return BigDecimal.ZERO;
            return new BigDecimal(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private LocalDate parseDateSafe(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        dateStr = dateStr.trim();
        
        // Try common formats
        String[] formats = {"yyyy-MM-dd", "yyyy/MM/dd", "yyyy/M/d", "yyyy-M-d"};
        for (String format : formats) {
            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    @DeleteMapping("/batch")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> batchDeleteStats(@RequestBody List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            statsService.removeByIds(ids);
        }
        return ResponseEntity.ok("Deleted successfully");
    }
}
