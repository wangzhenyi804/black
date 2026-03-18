package com.blackad.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blackad.backend.entity.Media;
import com.blackad.backend.entity.User;
import com.blackad.backend.service.MediaService;
import com.blackad.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import com.blackad.backend.utils.CsvUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/media")
public class MediaController {

    @Autowired
    private MediaService mediaService;

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public IPage<Media> getMediaList(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status
    ) {
        QueryWrapper<Media> queryWrapper = new QueryWrapper<>();
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            queryWrapper.eq("user_id", user.getId());
        }

        if (StringUtils.hasText(name)) {
            String searchName = name.trim();
            queryWrapper.and(wrapper -> {
                wrapper.like("name", searchName);
                try {
                    Long id = Long.valueOf(searchName);
                    wrapper.or().eq("id", id);
                } catch (NumberFormatException e) {
                    // Not a number, only search by name
                }
            });
        }
        if (StringUtils.hasText(category) && !"全部".equals(category)) queryWrapper.eq("category", category);
        if (StringUtils.hasText(status) && !"全部".equals(status)) queryWrapper.eq("status", status);

        return mediaService.page(new Page<>(page, size), queryWrapper);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Media createMedia(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Media media) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (user == null) {
            throw new RuntimeException("User not found: " + userDetails.getUsername());
        }
        media.setUserId(user.getId());
        media.setCreatedAt(LocalDateTime.now());
        if (!StringUtils.hasText(media.getStatus())) {
            media.setStatus("待初审");
        }
        try {
            mediaService.save(media);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save media: " + e.getMessage(), e);
        }
        return media;
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Media updateMedia(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id, @RequestBody Media media) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        Media existing = mediaService.getById(id);
        
        if (!"admin".equals(user.getRole()) && (existing.getUserId() == null || !existing.getUserId().equals(user.getId()))) {
            throw new AccessDeniedException("Access denied");
        }
        
        media.setId(id);
        media.setUserId(existing.getUserId()); // Preserve owner
        mediaService.updateById(media);
        return media;
    }

    @Autowired
    private com.blackad.backend.service.CodeSlotService codeSlotService;

    @Autowired
    private com.blackad.backend.service.StatsService statsService;

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteMedia(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        Media existing = mediaService.getById(id);
        if (existing == null) {
            throw new RuntimeException("Media not found");
        }

        // Check if there are code slots associated with this media
        long codeSlotCount = codeSlotService.query().eq("media_id", id).count();
        // Check if there is data associated with this media
        long statsCount = statsService.query().eq("media_id", id).count();
        
        if (codeSlotCount > 0 || statsCount > 0) {
            throw new RuntimeException("该媒体下存在代码位/代码位数据禁止删除");
        }

        mediaService.removeById(id);
    }

    @DeleteMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public void batchDeleteMedia(@AuthenticationPrincipal UserDetails userDetails, @RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        
        // Check if there are code slots associated with any of these media
        long codeSlotCount = codeSlotService.query().in("media_id", ids).count();
        // Check if there is data associated with any of these media
        long statsCount = statsService.query().in("media_id", ids).count();
        
        if (codeSlotCount > 0 || statsCount > 0) {
            throw new RuntimeException("选中的媒体下存在代码位/代码位数据禁止删除");
        }

        mediaService.removeByIds(ids);
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status
    ) {
        QueryWrapper<Media> queryWrapper = new QueryWrapper<>();
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (!"admin".equals(user.getRole())) {
            queryWrapper.eq("user_id", user.getId());
        }

        if (StringUtils.hasText(name)) {
            String searchName = name.trim();
            queryWrapper.and(wrapper -> {
                wrapper.like("name", searchName);
                try {
                    Long id = Long.valueOf(searchName);
                    wrapper.or().eq("id", id);
                } catch (NumberFormatException e) {
                    // Not a number, only search by name
                }
            });
        }
        if (StringUtils.hasText(category) && !"全部".equals(category)) queryWrapper.eq("category", category);
        if (StringUtils.hasText(status) && !"全部".equals(status)) queryWrapper.eq("status", status);
        
        List<Media> list = mediaService.list(queryWrapper);
        String csv = CsvUtils.toCsv(list, Media.class);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=media_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> importMedia(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam MultipartFile file
    ) throws IOException {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);
        List<Map<String, String>> data = CsvUtils.parseCsv(content);

        List<Media> mediaList = data.stream().map(row -> {
            Media media = new Media();
            media.setName(row.get("name"));
            media.setDomain(row.get("domain"));
            media.setCategory(row.get("category"));
            media.setType(row.get("type") != null ? row.get("type") : "Website");
            media.setStatus(row.get("status") != null ? row.get("status") : "待初审");
            media.setIcpCode(row.get("icpCode"));
            media.setNote(row.get("note"));
            media.setDescription(row.get("description"));
            media.setDailyVisits(row.get("dailyVisits"));
            media.setStatsAuthType(row.get("statsAuthType"));
            media.setUserId(user.getId());
            media.setCreatedAt(LocalDateTime.now());
            return media;
        }).collect(Collectors.toList());

        mediaService.saveBatch(mediaList);
        return ResponseEntity.ok("成功导入 " + mediaList.size() + " 条媒体信息");
    }
}
