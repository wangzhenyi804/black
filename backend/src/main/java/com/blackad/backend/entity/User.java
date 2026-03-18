package com.blackad.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("user")
public class User implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private String username;
    
    // @JsonIgnore
    private String password; // Hashed
    
    private String role; // "admin" or "user"
    private Integer isActive; // 1=Active, 0=Disabled, 3=Deleted
}
