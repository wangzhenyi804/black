package com.blackad.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.blackad.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
