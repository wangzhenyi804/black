package com.blackad.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.blackad.backend.entity.CodeSlot;

public interface CodeSlotService extends IService<CodeSlot> {
    CodeSlot getByName(String name);
}
