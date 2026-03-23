package com.blackad.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.blackad.backend.entity.OcrMappingHistory;

public interface OcrMappingHistoryService extends IService<OcrMappingHistory> {
    /**
     * 根据识别文本获取映射的目标名称
     */
    String getTargetName(String originalText);

    /**
     * 保存或更新映射关系
     */
    void saveOrUpdateMapping(String originalText, String targetSlotName);
}
