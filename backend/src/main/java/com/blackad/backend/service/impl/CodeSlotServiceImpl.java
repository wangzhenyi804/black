package com.blackad.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.blackad.backend.entity.CodeSlot;
import com.blackad.backend.mapper.CodeSlotMapper;
import com.blackad.backend.service.CodeSlotService;
import org.springframework.stereotype.Service;

@Service
public class CodeSlotServiceImpl extends ServiceImpl<CodeSlotMapper, CodeSlot> implements CodeSlotService {
    @Override
    public CodeSlot getByName(String name) {
        return lambdaQuery().eq(CodeSlot::getName, name).one();
    }
}
