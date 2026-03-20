package com.blackad.backend.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.alibaba.excel.EasyExcel;
import com.aliyun.ocr_api20210707.Client;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextRequest;
import com.aliyun.ocr_api20210707.models.RecognizeAllTextResponse;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.blackad.backend.dto.ImportPreviewDTO;
import com.blackad.backend.entity.CodeSlot;
import com.blackad.backend.service.CodeSlotService;
import com.blackad.backend.service.OcrMappingHistoryService;
import com.blackad.backend.service.OcrService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OcrServiceImpl implements OcrService {

    @Value("${aliyun.ocr.access-key-id:}")
    private String accessKeyId;

    @Value("${aliyun.ocr.access-key-secret:}")
    private String accessKeySecret;

    @Value("${aliyun.ocr.endpoint:ocr-api.cn-hangzhou.aliyuncs.com}")
    private String endpoint;

    @Autowired
    private CodeSlotService codeSlotService;

    @Autowired
    private com.blackad.backend.service.MediaService mediaService;

    @Autowired
    private OcrMappingHistoryService mappingHistoryService;

    private static final List<String> IGNORE_WORDS = java.util.Arrays.asList(
            "展现", "点击", "收入", "预估", "总", "代码位", "元", "率", "eCPM", "CPC", "CTR", "acp", "(", ")", "（", "）", "量"
    );

    private Client createClient() throws Exception {
        Config config = new Config()
                .setAccessKeyId(accessKeyId)
                .setAccessKeySecret(accessKeySecret);
        config.endpoint = endpoint;
        return new Client(config);
    }

    @Override
    public List<ImportPreviewDTO> parseImage(MultipartFile file) {
        log.info("开始识别图片: {}, 大小: {}", file.getOriginalFilename(), file.getSize());
        if (accessKeyId == null || accessKeyId.isEmpty()) {
            log.error("未配置阿里云 OCR access-key-id");
            throw new RuntimeException("阿里云 OCR 未配置 AccessKey");
        }
        
        try {
            Client client = createClient();
            RecognizeAllTextRequest request = new RecognizeAllTextRequest();
            request.body = file.getInputStream();
            request.type = "General"; // 设置识别类型为通用文字识别，这是必填参数
            
            RuntimeOptions runtime = new RuntimeOptions();
            log.info("正在调用阿里云 OCR API (Endpoint: {})", endpoint);
            
            RecognizeAllTextResponse response = client.recognizeAllTextWithOptions(request, runtime);
            
            if (response.statusCode != 200) {
                String errorJson = com.aliyun.teautil.Common.toJSONString(response);
                log.error("阿里云 OCR 响应异常, 状态码: {}, 响应体: {}", response.statusCode, errorJson);
                throw new RuntimeException("Aliyun OCR Error: " + response.statusCode + ", Details: " + errorJson);
            }
            
            log.info("阿里云 OCR 调用成功");
            List<String> rawTexts = new ArrayList<>();
            if (response.body != null && response.body.data != null) {
                // 将 RecognizeAllTextResponseBodyData 对象转为 Map，方便提取内容
                java.util.Map<String, Object> dataMap = response.body.data.toMap();
                log.debug("OCR 原始响应数据: {}", dataMap);
                
                // 尝试提取 content 字段 (通常是识别到的全文)
                Object content = dataMap.get("content");
                if (content == null) content = dataMap.get("Content");
                
                if (content != null) {
                    rawTexts.add(content.toString());
                } else {
                    // 如果没有直接的 content，尝试从 subImages 或 prism_wordsInfo 提取
                    log.warn("未在响应中找到 content 字段，尝试解析 prism_wordsInfo");
                    Object wordsInfo = dataMap.get("prism_wordsInfo");
                    if (wordsInfo instanceof java.util.List) {
                        for (Object word : (java.util.List<?>) wordsInfo) {
                            if (word instanceof java.util.Map) {
                                Object wordContent = ((java.util.Map<?, ?>) word).get("word");
                                if (wordContent != null) rawTexts.add(wordContent.toString());
                            }
                        }
                    }
                }
            }
            
            if (rawTexts.isEmpty()) {
                log.warn("OCR 识别结果为空");
            } else {
                log.info("OCR 提取到文本单元数量: {}", rawTexts.size());
            }
            
            return processOcrData(rawTexts);
        } catch (com.aliyun.tea.TeaException te) {
            log.error("阿里云 SDK 异常: code={}, message={}, data={}", te.getCode(), te.getMessage(), te.getData());
            throw new RuntimeException("OCR SDK 异常: " + te.getMessage());
        } catch (Exception e) {
            log.error("OCR 过程发生非预期异常", e);
            throw new RuntimeException("图片识别失败: " + e.getMessage());
        }
    }

    @Override
    public List<ImportPreviewDTO> parseFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) return new ArrayList<>();

        if (filename.toLowerCase().endsWith(".csv")) {
            return parseCsvForPreview(file);
        } else if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) {
            return parseExcelForPreview(file);
        } else {
            return parseImage(file);
        }
    }

    private List<ImportPreviewDTO> parseExcelForPreview(MultipartFile file) {
        try {
            List<Map<Integer, String>> list = EasyExcel.read(file.getInputStream()).sheet().headRowNumber(0).doReadSync();
            if (list == null || list.isEmpty()) return new ArrayList<>();
            return processTabularData(list);
        } catch (Exception e) {
            log.error("Excel 解析失败", e);
            return new ArrayList<>();
        }
    }

    private List<ImportPreviewDTO> parseCsvForPreview(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String content = new String(bytes, StandardCharsets.UTF_8);
            if (!content.contains("代码位") && !content.contains("计费名") && !content.contains("展现") && !content.contains("点击")) {
                content = new String(bytes, java.nio.charset.Charset.forName("GBK"));
            }

            List<Map<String, String>> rawData = com.blackad.backend.utils.CsvUtils.parseCsv(content);
            if (rawData.isEmpty()) return new ArrayList<>();

            // Convert rawData (Map<String, String>) to Map<Integer, String> to use common processing
            List<Map<Integer, String>> tabularData = new ArrayList<>();
            // The first row should be headers
            Map<Integer, String> headerRow = new HashMap<>();
            String firstLine = content.split("\\r?\\n")[0];
            List<String> headerList = com.blackad.backend.utils.CsvUtils.parseCsvLineList(firstLine);
            for (int i = 0; i < headerList.size(); i++) {
                headerRow.put(i, headerList.get(i).trim().replace("\uFEFF", ""));
            }
            tabularData.add(headerRow);

            for (Map<String, String> row : rawData) {
                Map<Integer, String> dataRow = new HashMap<>();
                for (int i = 0; i < headerList.size(); i++) {
                    String h = headerList.get(i).trim().replace("\uFEFF", "");
                    dataRow.put(i, row.get(h));
                }
                tabularData.add(dataRow);
            }

            return processTabularData(tabularData);
        } catch (Exception e) {
            log.error("CSV 解析失败", e);
            return new ArrayList<>();
        }
    }

    private List<ImportPreviewDTO> processTabularData(List<Map<Integer, String>> data) {
        List<ImportPreviewDTO> results = new ArrayList<>();
        if (data.size() < 2) return results;

        Map<Integer, String> headers = data.get(0);
        int nameIdx = -1, dateIdx = -1, impIdx = -1, clickIdx = -1, revIdx = -1, idIdx = -1, mediaIdx = -1;

        for (Map.Entry<Integer, String> entry : headers.entrySet()) {
            String h = entry.getValue().trim();
            String hLower = h.toLowerCase();
            
            // 精确优先匹配
            if (h.equals("代码位ID") || h.equals("代码位Id") || h.equals("代码位id")) idIdx = entry.getKey();
            else if (h.equals("代码位")) nameIdx = entry.getKey();
            else if (h.contains("媒体(域名)")) mediaIdx = entry.getKey();
            else if (h.contains("时间")) dateIdx = entry.getKey();
            else if (h.contains("展现")) impIdx = entry.getKey();
            else if (h.contains("点击")) clickIdx = entry.getKey();
            else if (h.contains("收入")) revIdx = entry.getKey();
            
            // 模糊备选匹配 (如果还没匹配上)
            if (idIdx == -1 && (hLower.contains("codeslotid") || hLower.contains("代码位id"))) idIdx = entry.getKey();
            if (nameIdx == -1 && (hLower.contains("计费名") || hLower.contains("slot name") || hLower.contains("名称"))) nameIdx = entry.getKey();
            if (dateIdx == -1 && (hLower.contains("日期") || hLower.contains("date") || hLower.contains("day"))) dateIdx = entry.getKey();
            if (impIdx == -1 && (hLower.contains("显示") || hLower.contains("impressions") || hLower.contains("展示"))) impIdx = entry.getKey();
            if (clickIdx == -1 && hLower.contains("clicks")) clickIdx = entry.getKey();
            if (revIdx == -1 && (hLower.contains("金额") || hLower.contains("revenue") || hLower.contains("income") || hLower.contains("分成前"))) revIdx = entry.getKey();
        }

        log.info("列索引识别结果: name={}, id={}, media={}, date={}, imp={}, click={}, rev={}", 
                nameIdx, idIdx, mediaIdx, dateIdx, impIdx, clickIdx, revIdx);

        for (int i = 1; i < data.size(); i++) {
            Map<Integer, String> row = data.get(i);
            ImportPreviewDTO dto = new ImportPreviewDTO();

            String originalText = null;
            // 优先使用“代码位”列作为映射识别标识
            if (nameIdx != -1) originalText = row.get(nameIdx);
            if ((originalText == null || originalText.isEmpty()) && idIdx != -1) originalText = row.get(idIdx);

            if (originalText == null || originalText.isEmpty()) continue;

            dto.setOriginalText(originalText);
            dto.setCodeSlotName(originalText);

            if (mediaIdx != -1) dto.setMediaName(row.get(mediaIdx));
            if (dateIdx != -1) dto.setDate(parseDate(row.get(dateIdx)));
            if (impIdx != -1) dto.setImpressions(parseLongSafe(row.get(impIdx)));
            if (clickIdx != -1) dto.setClicks(parseLongSafe(row.get(clickIdx)));
            if (revIdx != -1) dto.setRevenue(parseBigDecimalSafe(row.get(revIdx)));

            // 自动匹配逻辑
            String targetName = mappingHistoryService.getTargetName(originalText);
            if (targetName != null && !targetName.isEmpty()) {
                dto.setCodeSlotName(targetName);
                CodeSlot slot = codeSlotService.getByName(targetName);
                if (slot != null) {
                    dto.setCodeSlotId(slot.getId());
                    dto.setMediaId(slot.getMediaId());
                    com.blackad.backend.entity.Media media = mediaService.getById(slot.getMediaId());
                    if (media != null) dto.setMediaName(media.getName());
                    dto.setStatusMessage("已匹配记忆");
                    dto.setNewSlot(false);
                }
            } else {
                CodeSlot slot = null;
                // 优先通过表格中的代码位ID (code_slot_id) 进行系统内精准匹配
                if (idIdx != -1 && row.get(idIdx) != null) {
                    String rowCodeSlotId = row.get(idIdx).trim();
                    slot = codeSlotService.query().eq("code_slot_id", rowCodeSlotId).one();
                }
                // 其次通过名称匹配
                if (slot == null) {
                    slot = codeSlotService.getByName(originalText);
                }

                if (slot != null) {
                    dto.setCodeSlotId(slot.getId());
                    dto.setCodeSlotName(slot.getName());
                    dto.setMediaId(slot.getMediaId());
                    com.blackad.backend.entity.Media media = mediaService.getById(slot.getMediaId());
                    if (media != null) dto.setMediaName(media.getName());
                    dto.setStatusMessage("精准匹配");
                    dto.setNewSlot(false);
                } else {
                    dto.setStatusMessage("待确认(新代码位)");
                    dto.setNewSlot(true);
                    // 如果表格里有媒体名，使用表格里的
                    if (dto.getMediaName() == null || dto.getMediaName().isEmpty()) {
                        dto.setMediaName("待确认");
                    }
                }
            }

            calculateMetrics(dto);
            results.add(dto);
        }
        return results;
    }

    private Long parseLongSafe(String value) {
        if (value == null) return 0L;
        try {
            String clean = value.replace(",", "").replace("¥", "").replace("￥", "").replace("$", "").trim();
            if (clean.isEmpty()) return 0L;
            return Long.valueOf(clean);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private BigDecimal parseBigDecimalSafe(String value) {
        if (value == null) return BigDecimal.ZERO;
        try {
            String clean = value.replace(",", "").replace("¥", "").replace("￥", "").replace("$", "").trim();
            if (clean.isEmpty()) return BigDecimal.ZERO;
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private List<ImportPreviewDTO> processOcrData(List<String> rawTexts) {
        List<ImportPreviewDTO> results = new ArrayList<>();
        if (rawTexts.isEmpty()) return results;

        // 1. 全文标准化处理
        String fullText = String.join(" ", rawTexts)
                .replace("，", "")
                .replace("￥", "")
                .replace("¥", "")
                .replace("$", "")
                .replace(" ", "  ");

        log.info("标准化后的解析文本: {}", fullText);

        List<Long> candidates = new ArrayList<>();
        List<BigDecimal> decimals = new ArrayList<>();
        BigDecimal identifiedCtr = null;
        LocalDate foundDate = parseDate(fullText);

        // 2. 提取所有数字并进行“千分位修正”
        java.util.regex.Pattern numPattern = java.util.regex.Pattern.compile("[0-9]+(\\.[0-9]+)?%?");
        java.util.regex.Matcher numMatcher = numPattern.matcher(fullText);
        while (numMatcher.find()) {
            String s = numMatcher.group().replace(",", "");
            if (s.endsWith("%")) {
                try { identifiedCtr = new BigDecimal(s.replace("%", "")); } catch (Exception e) {}
                continue;
            }
            
            try {
                if (s.contains(".")) {
                    String[] parts = s.split("\\.");
                    if (parts.length == 2 && parts[1].length() == 3) {
                        candidates.add(Long.parseLong(parts[0] + parts[1]));
                    } else {
                        decimals.add(new BigDecimal(s));
                    }
                } else {
                    candidates.add(Long.parseLong(s));
                }
            } catch (Exception ignored) {}
        }

        // 3. 排除年份干扰 (2020-2100)
        candidates.removeIf(val -> val >= 2020 && val <= 2100);

        // 4. 启发式分配指标 (基于数学关系校验)
        candidates.sort((a, b) -> b.compareTo(a));
        decimals.sort((a, b) -> b.compareTo(a));

        ImportPreviewDTO dto = new ImportPreviewDTO();
        dto.setDate(foundDate != null ? foundDate : LocalDate.now());
        
        // 展现量：候选整数中最大的
        if (!candidates.isEmpty()) dto.setImpressions(candidates.get(0));
        
        // 点击量：基于 CTR 校验
        if (candidates.size() >= 2) {
            long c1 = candidates.get(1);
            if (identifiedCtr != null && dto.getImpressions() != null && dto.getImpressions() > 0) {
                double calcCtr = (double) c1 / dto.getImpressions() * 100;
                if (Math.abs(calcCtr - identifiedCtr.doubleValue()) < 0.5) {
                    dto.setClicks(c1);
                } else if (candidates.size() >= 3) {
                    long c2 = candidates.get(2);
                    double calcCtr2 = (double) c2 / dto.getImpressions() * 100;
                    if (Math.abs(calcCtr2 - identifiedCtr.doubleValue()) < 0.5) {
                        dto.setClicks(c2);
                    } else {
                        dto.setClicks(c1);
                    }
                } else {
                    dto.setClicks(c1);
                }
            } else {
                dto.setClicks(c1);
            }
        }

        // 收入：候选小数中最大的
        if (!decimals.isEmpty()) dto.setRevenue(decimals.get(0));

        // 5. 提取名称：排除指标、排除标签后的“最显著异类”
        String identifiedName = null;
        String[] tokens = fullText.split("[\\s\\n]+");
        
        Set<String> identifiedStatsValues = new java.util.HashSet<>();
        if (dto.getImpressions() != null) {
            identifiedStatsValues.add(dto.getImpressions().toString());
            // 同时添加带千分位样式的字符串（虽然已经替换了，但为了保险）
            identifiedStatsValues.add(java.text.NumberFormat.getInstance().format(dto.getImpressions()));
        }
        if (dto.getClicks() != null) identifiedStatsValues.add(dto.getClicks().toString());
        if (dto.getRevenue() != null) {
            identifiedStatsValues.add(dto.getRevenue().stripTrailingZeros().toPlainString());
            identifiedStatsValues.add(dto.getRevenue().setScale(2, java.math.RoundingMode.HALF_UP).toString());
        }

        log.info("已识别的指标值集合: {}", identifiedStatsValues);

        List<String> nameCandidates = new ArrayList<>();
        for (String t : tokens) {
            String cleanT = t.trim().replace(" ", "");
            if (cleanT.isEmpty()) continue;
            
            // a. 排除纯标签词 (包含关系)
            boolean isLabel = false;
            for (String ignore : IGNORE_WORDS) {
                if (cleanT.contains(ignore)) {
                    isLabel = true;
                    break;
                }
            }
            if (isLabel) continue;

            // b. 排除日期
            if (parseDate(cleanT) != null || cleanT.matches(".*\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}.*")) continue;

            // c. 排除已经作为指标被抓取的数值
            String pureNum = cleanT.replace(".", "");
            if (identifiedStatsValues.contains(cleanT) || identifiedStatsValues.contains(pureNum)) continue;

            // d. 排除其他明显的统计数值 (如 eCPM, CTR, CPC 的残余)
            if (cleanT.matches("^[0-9.%¥￥$]+$")) {
                double val = 0;
                try { val = Double.parseDouble(cleanT.replaceAll("[%¥￥$]", "")); } catch (Exception e) {}
                if (val < 100 && !cleanT.equals("558")) continue; // 排除小数值，但保留可能的短数字名称
                if (val > 10000) continue; // 排除过大的数
            }

            nameCandidates.add(cleanT);
        }

        log.info("候选名称列表: {}", nameCandidates);

        // 从候选词中挑选最像名称的
        if (!nameCandidates.isEmpty()) {
            // 优先级 1: 包含中文且包含数字的 (如 "新1")
            for (String c : nameCandidates) {
                if (c.matches(".*[\\u4e00-\\u9fa5].*") && c.matches(".*[0-9].*")) {
                    identifiedName = c;
                    break;
                }
            }
            // 优先级 2: 纯中文且不是标签的
            if (identifiedName == null) {
                for (String c : nameCandidates) {
                    if (c.matches("^[\\u4e00-\\u9fa5]+$")) {
                        identifiedName = c;
                        break;
                    }
                }
            }
            // 优先级 3: 第一个候选词 (如 "558")
            if (identifiedName == null) {
                identifiedName = nameCandidates.get(0);
            }
        }

        log.info("最终识别出的代码位名称: {}", identifiedName);

        if (identifiedName != null && !identifiedName.isEmpty()) {
            dto.setOriginalText(identifiedName);
            String targetName = mappingHistoryService.getTargetName(identifiedName);
            if (targetName != null && !targetName.isEmpty()) {
                dto.setCodeSlotName(targetName);
                CodeSlot slot = codeSlotService.getByName(targetName);
                if (slot != null) {
                    dto.setCodeSlotId(slot.getId());
                    dto.setMediaId(slot.getMediaId());
                    com.blackad.backend.entity.Media media = mediaService.getById(slot.getMediaId());
                    if (media != null) dto.setMediaName(media.getName());
                    dto.setStatusMessage("已匹配记忆");
                }
            } else {
                // 模糊匹配逻辑
                List<CodeSlot> allSlots = codeSlotService.list();
                CodeSlot bestMatch = null;
                double maxSimilarity = 0.0;
                for (CodeSlot slot : allSlots) {
                    double similarity = calculateSimilarity(identifiedName, slot.getName());
                    // 只有当相似度很高且不是纯数字简单匹配时才自动关联
                    if (similarity > 0.7 && similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        bestMatch = slot;
                    }
                }
                
                if (bestMatch != null && maxSimilarity > 0.8) {
                    dto.setCodeSlotName(bestMatch.getName());
                    dto.setCodeSlotId(bestMatch.getId());
                    dto.setMediaId(bestMatch.getMediaId());
                    com.blackad.backend.entity.Media media = mediaService.getById(bestMatch.getMediaId());
                    if (media != null) dto.setMediaName(media.getName());
                    dto.setStatusMessage("模糊匹配 (" + (int)(maxSimilarity * 100) + "%)");
                } else {
                    dto.setCodeSlotName(identifiedName);
                    dto.setNewSlot(true);
                    dto.setStatusMessage("待确认(新代码位)");
                }
            }
        }

        calculateMetrics(dto);
        results.add(dto);
        return results;
    }

    // --- 启发式辅助方法 ---

    private LocalDate parseDate(String text) {
        if (text == null || text.isEmpty()) return null;
        // 增强正则：支持 yyyy-MM-dd, yyyy/MM/dd, yyyy.MM.dd, yyyyMMdd 等多种常见格式
        String[] patterns = {
            "(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})",
            "(\\d{4})年(\\d{1,2})月(\\d{1,2})日",
            "(\\d{4})(\\d{2})(\\d{2})"
        };
        
        for (String p : patterns) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(p).matcher(text);
            if (m.find()) {
                try {
                    int year = Integer.parseInt(m.group(1));
                    int month = Integer.parseInt(m.group(2));
                    int day = Integer.parseInt(m.group(3));
                    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                        return LocalDate.of(year, month, day);
                    }
                } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private void calculateMetrics(ImportPreviewDTO dto) {
        if (dto.getRevenue() != null && dto.getImpressions() != null && dto.getImpressions() > 0) {
            dto.setEcpm(dto.getRevenue().multiply(new BigDecimal("1000"))
                    .divide(new BigDecimal(dto.getImpressions()), 2, RoundingMode.HALF_UP));
            dto.setCtr(new BigDecimal(dto.getClicks()).divide(new BigDecimal(dto.getImpressions()), 4, RoundingMode.HALF_UP));
        }
        if (dto.getRevenue() != null && dto.getClicks() != null && dto.getClicks() > 0) {
            dto.setAcp(dto.getRevenue().divide(new BigDecimal(dto.getClicks()), 2, RoundingMode.HALF_UP));
        }
    }

    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        int maxLen = Math.max(s1.length(), s2.length());
        if (maxLen == 0) return 1.0;
        return (1.0 - (double) levenshteinDistance(s1, s2) / maxLen);
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[s1.length()][s2.length()];
    }
}
