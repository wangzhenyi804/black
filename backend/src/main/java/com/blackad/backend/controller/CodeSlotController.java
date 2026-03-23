package com.blackad.backend.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blackad.backend.entity.CodeSlot;
import com.blackad.backend.entity.User;
import com.blackad.backend.service.CodeGenerationService;
import com.blackad.backend.service.CodeSlotService;
import com.blackad.backend.service.UserService;
import com.blackad.backend.utils.CsvUtils;

@RestController
@RequestMapping("/codeslots")
public class CodeSlotController {

    @Autowired
    private CodeSlotService codeSlotService;

    @Autowired
    private UserService userService;

    @Autowired
    private CodeGenerationService codeGenerationService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public IPage<CodeSlot> getCodeSlots(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long mediaId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        QueryWrapper<CodeSlot> queryWrapper = new QueryWrapper<>();
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            queryWrapper.eq("user_id", user.getId());
        } else if (userId != null) {
            queryWrapper.eq("user_id", userId);
        }

        if (StringUtils.hasText(name)) {
            String searchName = name.trim();
            queryWrapper.and(wrapper -> {
                wrapper.like("name", searchName)
                       .or()
                       .like("code_slot_id", searchName);
            });
        }
        if (mediaId != null) queryWrapper.eq("media_id", mediaId);
        if (StringUtils.hasText(type) && !"全部".equals(type)) queryWrapper.eq("type", type);
        if (StringUtils.hasText(status) && !"全部".equals(status)) queryWrapper.eq("status", status);

        queryWrapper.orderByDesc("created_at");
        return codeSlotService.page(new Page<>(page, size), queryWrapper);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CodeSlot createCodeSlot(@AuthenticationPrincipal UserDetails userDetails, @RequestBody CodeSlot codeSlot) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        
        if ("admin".equals(user.getRole()) && codeSlot.getUserId() != null) {
            // Admin can assign to other user
            User targetUser = userService.getById(codeSlot.getUserId());
            if (targetUser == null) {
                throw new RuntimeException("Target user not found");
            }
            codeSlot.setUserId(targetUser.getId());
        } else {
            // Default to current user
            codeSlot.setUserId(user.getId());
        }

        codeSlot.setCreatedAt(LocalDateTime.now());
        codeSlot.setUpdatedAt(LocalDateTime.now());
        if (!StringUtils.hasText(codeSlot.getStatus())) {
            codeSlot.setStatus("ACTIVE");
        }
        if (codeSlot.getRevenueRatio() == null) {
            codeSlot.setRevenueRatio(new java.math.BigDecimal("0.7"));
        }
        
        // Save first to get ID
        codeSlotService.save(codeSlot);
        
        // Generate Code
        String code = codeGenerationService.generateCode(codeSlot);
        codeSlot.setCodeContent(code);
        codeSlotService.updateById(codeSlot);
        
        return codeSlot;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CodeSlot updateCodeSlot(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id, @RequestBody CodeSlot codeSlot) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        CodeSlot existing = codeSlotService.getById(id);
        
        if (existing == null) {
            throw new RuntimeException("CodeSlot not found");
        }
        if (!"admin".equals(user.getRole()) && !existing.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        
        // Allow updating specific fields
        if (codeSlot.getName() != null) existing.setName(codeSlot.getName());
        if (codeSlot.getStatus() != null) existing.setStatus(codeSlot.getStatus());
        if (codeSlot.getIsShielding() != null) existing.setIsShielding(codeSlot.getIsShielding());
        
        if (codeSlot.getNote() != null) existing.setNote(codeSlot.getNote());
        if (codeSlot.getImageUrl() != null) existing.setImageUrl(codeSlot.getImageUrl());
        if (codeSlot.getRevenueRatio() != null) {
            existing.setRevenueRatio(codeSlot.getRevenueRatio());
        }
        if (codeSlot.getUserId() != null) {
            existing.setUserId(codeSlot.getUserId());
        }
        if (codeSlot.getMediaId() != null) {
            existing.setMediaId(codeSlot.getMediaId());
        }
        
        // Regenerate code if critical fields change (though usually dimensions/type shouldn't change)
        // Here we assume only settings change, maybe regenerate code if shielding changes
        if (codeSlot.getIsShielding() != null) {
            String code = codeGenerationService.generateCode(existing);
            existing.setCodeContent(code);
        }
        
        existing.setUpdatedAt(LocalDateTime.now());
        codeSlotService.updateById(existing);
        return existing;
    }

    @PutMapping("/{id}/ratio")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateCodeSlotRatio(@AuthenticationPrincipal UserDetails userDetails,
                                                  @PathVariable Long id,
                                                  @RequestBody Map<String, java.math.BigDecimal> body) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            throw new AccessDeniedException("Only administrators can update ratios");
        }

        java.math.BigDecimal ratio = body.get("ratio");
        CodeSlot slot = codeSlotService.getById(id);
        if (slot != null) {
            slot.setRevenueRatio(ratio);
            codeSlotService.updateById(slot);
        }
        return ResponseEntity.ok().build();
    }
    
    @Autowired
    private com.blackad.backend.service.StatsService statsService;

    @Autowired
    private com.blackad.backend.service.MediaService mediaService;

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCodeSlot(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        CodeSlot existing = codeSlotService.getById(id);
        if (existing != null) {
            if (!"admin".equals(user.getRole()) && !existing.getUserId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied");
            }
            
            // Delete associated stats data directly
            statsService.remove(new QueryWrapper<com.blackad.backend.entity.Stats>().eq("code_slot_id", id));
            
            // Delete the code slot
            codeSlotService.removeById(id);
        }
    }

    @DeleteMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public void batchDeleteCodeSlots(@AuthenticationPrincipal UserDetails userDetails, @RequestBody List<Long> ids) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        
        List<CodeSlot> existingSlots = codeSlotService.listByIds(ids);
        for (CodeSlot existing : existingSlots) {
            if (!"admin".equals(user.getRole()) && !existing.getUserId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied for one or more code slots");
            }
        }
        
        if (!ids.isEmpty()) {
            // Delete associated stats data directly
            statsService.remove(new QueryWrapper<com.blackad.backend.entity.Stats>().in("code_slot_id", ids));
            // Delete the code slots
            codeSlotService.removeByIds(ids);
        }
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportCodeSlots(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long mediaId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status
    ) {
        QueryWrapper<CodeSlot> query = new QueryWrapper<>();
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            query.eq("user_id", user.getId());
        } else if (userId != null) {
            query.eq("user_id", userId);
        }

        if (StringUtils.hasText(name)) {
            String searchName = name.trim();
            query.and(wrapper -> {
                wrapper.like("name", searchName)
                       .or()
                       .like("code_slot_id", searchName);
            });
        }
        if (mediaId != null) query.eq("media_id", mediaId);
        if (StringUtils.hasText(type) && !"全部".equals(type)) query.eq("type", type);
        if (StringUtils.hasText(status) && !"全部".equals(status)) query.eq("status", status);

        query.orderByDesc("created_at");
        query.last("LIMIT 300"); // Limit to 300 records as requested

        List<CodeSlot> list = codeSlotService.list(query);
        
        StringBuilder csv = new StringBuilder("\uFEFF"); // BOM for Excel UTF-8 compatibility
        csv.append("代码位名称,代码位ID,所属媒体,终端,形式,分成系数,状态\n");
        
        for (CodeSlot slot : list) {
            com.blackad.backend.entity.Media media = mediaService.getById(slot.getMediaId());
            csv.append(CsvUtils.escape(slot.getName())).append(",")
               .append(CsvUtils.escape(slot.getCodeSlotId())).append(",")
               .append(media != null ? CsvUtils.escape(media.getName()) : "未知").append(",")
               .append(CsvUtils.escape(slot.getTerminal())).append(",")
               .append(CsvUtils.escape(slot.getType())).append(",")
               .append(slot.getRevenueRatio() != null ? slot.getRevenueRatio() : "0.70").append(",")
               .append("ACTIVE".equals(slot.getStatus()) ? "正常" : "PAUSED".equals(slot.getStatus()) ? "暂停" : slot.getStatus())
               .append("\n");
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=codeslot_export.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> importCodeSlots(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam MultipartFile file
    ) throws IOException {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);
        List<Map<String, String>> data = CsvUtils.parseCsv(content);

        int successCount = 0;
        int failCount = 0;

        for (Map<String, String> row : data) {
            try {
                String codeSlotId = row.get("codeSlotId");
                String name = row.get("name");
                
                // Check for existing combination
                long existing = codeSlotService.query()
                        .eq("code_slot_id", codeSlotId)
                        .eq("name", name)
                        .count();
                        
                if (existing > 0) {
                    failCount++;
                    continue;
                }

                CodeSlot slot = new CodeSlot();
                slot.setCodeSlotId(codeSlotId);
                slot.setName(name);
                slot.setMediaId(row.get("mediaId") != null ? Long.valueOf(row.get("mediaId")) : null);
                slot.setType(row.get("type"));
                slot.setTerminal(row.get("terminal") != null ? row.get("terminal") : "H5");
                slot.setDisplayType(row.get("displayType") != null ? row.get("displayType") : "固定块");
                slot.setAdType(row.get("adType") != null ? row.get("adType") : "信息流");
                slot.setAdForm(row.get("adForm") != null ? row.get("adForm") : "原生缩略图");
                slot.setRatio(row.get("ratio") != null ? Integer.valueOf(row.get("ratio")) : 6);
                slot.setStyleType(row.get("styleType") != null ? row.get("styleType") : "默认");
                slot.setNote(row.get("note"));
                slot.setImageUrl(row.get("imageUrl"));
                slot.setIsShielding(row.get("isShielding") != null && Boolean.parseBoolean(row.get("isShielding")));
                slot.setStatus(row.get("status") != null ? row.get("status") : "ACTIVE");
                slot.setUserId(user.getId());
                slot.setCreatedAt(LocalDateTime.now());
                slot.setUpdatedAt(LocalDateTime.now());
                
                codeSlotService.save(slot);
                
                // Generate Code
                String code = codeGenerationService.generateCode(slot);
                slot.setCodeContent(code);
                codeSlotService.updateById(slot);
                
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }

        String msg = "成功导入 " + successCount + " 条代码位信息。";
        if (failCount > 0) {
            msg += " 失败（或重复） " + failCount + " 条。";
        }
        return ResponseEntity.ok(msg);
    }
}
