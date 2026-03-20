package com.blackad.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.blackad.backend.entity.OcrMappingHistory;
import com.blackad.backend.mapper.OcrMappingHistoryMapper;
import com.blackad.backend.service.OcrMappingHistoryService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class OcrMappingHistoryServiceImpl extends ServiceImpl<OcrMappingHistoryMapper, OcrMappingHistory> implements OcrMappingHistoryService {

    @Override
    public String getTargetName(String originalText) {
        OcrMappingHistory mapping = this.query().eq("original_text", originalText).one();
        return mapping != null ? mapping.getTargetSlotName() : null;
    }

    @Override
    public void saveOrUpdateMapping(String originalText, String targetSlotName) {
        if (originalText == null || originalText.trim().isEmpty() || targetSlotName == null || targetSlotName.trim().isEmpty()) {
            return;
        }
        
        OcrMappingHistory mapping = this.query().eq("original_text", originalText).one();
        if (mapping == null) {
            mapping = new OcrMappingHistory();
            mapping.setOriginalText(originalText);
            mapping.setTargetSlotName(targetSlotName);
            mapping.setLastUsedAt(LocalDateTime.now());
            this.save(mapping);
        } else {
            mapping.setTargetSlotName(targetSlotName);
            mapping.setLastUsedAt(LocalDateTime.now());
            this.updateById(mapping);
        }
    }
}
