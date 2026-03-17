package com.blackad.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("media")
public class Media implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String name;
    private String type; // "Banner", "Video", etc.
    private String description;
    private LocalDateTime createdAt;
    
    private String domain;
    private String category;
    private String icpCode;
    private String dailyVisits;
    private String statsAuthType;
    private String agentAuthUrl;
    private String copyrightUrl;
    private String status; // PENDING_REVIEW, APPROVED, etc.
    private String rejectionReason;
    private String note;
}
