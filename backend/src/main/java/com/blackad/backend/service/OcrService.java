package com.blackad.backend.service;

import com.blackad.backend.dto.ImportPreviewDTO;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface OcrService {
    /**
     * 解析图片并返回预览列表
     */
    List<ImportPreviewDTO> parseImage(MultipartFile file);

    /**
     * 统一解析入口 (支持图片、CSV、Excel)
     */
    List<ImportPreviewDTO> parseFile(MultipartFile file);
}
