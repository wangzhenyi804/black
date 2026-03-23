package com.blackad.backend;

import com.alibaba.excel.EasyExcel;
import java.io.File;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class TestExcel {
    public static void main(String[] args) {
        try {
            File f = new File("/Users/wangzhenyi/MyData/pycode/black-ad/download/20.xls");
            List<Map<Integer, String>> list = EasyExcel.read(f).sheet().doReadSync();
            System.out.println("Total rows read: " + list.size());
            
            if (list.size() < 2) return;

            // Search for headers in the first 5 rows to be safe
            Map<Integer, String> headers = null;
            int headerRowIndex = 0;
            for (int i = 0; i < Math.min(5, list.size()); i++) {
                Map<Integer, String> row = list.get(i);
                boolean hasName = false, hasDate = false, hasImp = false;
                for (String val : row.values()) {
                    if (val == null) continue;
                    String vLower = val.toLowerCase();
                    if (vLower.contains("计费名") || vLower.contains("代码位") || vLower.contains("slot")) hasName = true;
                    if (vLower.contains("时间") || vLower.contains("日期") || vLower.contains("date")) hasDate = true;
                    if (vLower.contains("展现") || vLower.contains("展示") || vLower.contains("impressions")) hasImp = true;
                }
                if (hasName || (hasDate && hasImp)) {
                    headers = row;
                    headerRowIndex = i;
                    System.out.println("Found headers at row " + i + ": " + headers);
                    break;
                }
            }

            // FALLBACK: If headers are completely missing (maybe the user deleted the first row by accident or EasyExcel skipped it)
            // Let's print out the first row to see what it actually looks like.
            if (headers == null && list.size() > 0) {
                System.out.println("Could not find headers! Printing first row to see if it's data:");
                System.out.println(list.get(0));
                return;
            }

            int nameIdx = -1, dateIdx = -1, impIdx = -1, clickIdx = -1, revIdx = -1, idIdx = -1, mediaIdx = -1;

            // 1. 第一遍：最精确标准词
            for (Map.Entry<Integer, String> entry : headers.entrySet()) {
                if (entry.getValue() == null || entry.getValue().trim().isEmpty()) continue;
                String h = entry.getValue().trim();
                String hLower = h.toLowerCase();
                
                if (idIdx == -1 && (hLower.equals("代码位id") || hLower.equals("codeslotid"))) idIdx = entry.getKey();
                if (nameIdx == -1 && h.equals("代码位")) nameIdx = entry.getKey();
                if (mediaIdx == -1 && (h.equals("媒体(域名)") || h.equals("所属媒体"))) mediaIdx = entry.getKey();
                if (dateIdx == -1 && h.equals("时间")) dateIdx = entry.getKey();
                if (impIdx == -1 && h.equals("展现")) impIdx = entry.getKey();
                if (clickIdx == -1 && h.equals("点击")) clickIdx = entry.getKey();
                if (revIdx == -1 && h.equals("收入")) revIdx = entry.getKey();
            }

            // 2. 第二遍：精确备选词
            for (Map.Entry<Integer, String> entry : headers.entrySet()) {
                if (entry.getValue() == null || entry.getValue().trim().isEmpty()) continue;
                String h = entry.getValue().trim();
                String hLower = h.toLowerCase();
                
                if (nameIdx == -1 && (h.equals("计费名") || hLower.equals("slot name") || h.equals("名称") || h.equals("广告位"))) nameIdx = entry.getKey();
                if (mediaIdx == -1 && h.equals("媒体")) mediaIdx = entry.getKey();
                if (dateIdx == -1 && (h.equals("日期") || hLower.equals("date") || hLower.equals("day"))) dateIdx = entry.getKey();
                if (impIdx == -1 && (h.equals("展示") || h.equals("显示") || hLower.equals("impressions") || h.equals("展现量"))) impIdx = entry.getKey();
                if (clickIdx == -1 && (h.equals("点击量") || hLower.equals("clicks"))) clickIdx = entry.getKey();
                if (revIdx == -1 && (h.equals("预估收入") || h.equals("分成前收入") || h.equals("金额") || hLower.equals("revenue") || hLower.equals("income"))) revIdx = entry.getKey();
            }

            // 3. 第三遍：模糊匹配
            for (Map.Entry<Integer, String> entry : headers.entrySet()) {
                if (entry.getValue() == null || entry.getValue().trim().isEmpty()) continue;
                String h = entry.getValue().trim();
                String hLower = h.toLowerCase();
                
                if (idIdx == -1 && (hLower.contains("codeslotid") || hLower.contains("代码位id"))) idIdx = entry.getKey();
                if (nameIdx == -1 && (hLower.contains("计费名") || hLower.contains("slot name") || hLower.contains("名称") || hLower.contains("广告位"))) nameIdx = entry.getKey();
                if (mediaIdx == -1 && (h.contains("媒体"))) mediaIdx = entry.getKey();
                if (dateIdx == -1 && (hLower.contains("日期") || hLower.contains("date") || hLower.contains("day") || h.contains("时间"))) dateIdx = entry.getKey();
                
                if (impIdx == -1 && (hLower.contains("显示") || hLower.contains("impressions") || hLower.contains("展示") || hLower.contains("展现")) && !h.contains("千次")) impIdx = entry.getKey();
                if (clickIdx == -1 && (hLower.contains("clicks") || hLower.contains("点击")) && !h.contains("单次") && !h.contains("点击率")) clickIdx = entry.getKey();
                if (revIdx == -1 && (hLower.contains("金额") || hLower.contains("revenue") || hLower.contains("income") || hLower.contains("分成前") || hLower.contains("预估") || hLower.contains("收入"))) revIdx = entry.getKey();
            }

            System.out.printf("列索引识别结果: name=%d, id=%d, media=%d, date=%d, imp=%d, click=%d, rev=%d\n", 
                    nameIdx, idIdx, mediaIdx, dateIdx, impIdx, clickIdx, revIdx);

            for (int i = headerRowIndex + 1; i < Math.min(list.size(), headerRowIndex + 3); i++) {
                Map<Integer, String> row = list.get(i);
                
                String originalText = null;
                if (nameIdx != -1) originalText = row.get(nameIdx);
                if ((originalText == null || originalText.isEmpty()) && idIdx != -1) originalText = row.get(idIdx);

                if (originalText == null || originalText.isEmpty()) {
                    System.out.println("Row " + i + " skipped due to empty originalText");
                    continue;
                }
                
                Long imp = parseLongSafe(impIdx != -1 ? row.get(impIdx) : null);
                Long clk = parseLongSafe(clickIdx != -1 ? row.get(clickIdx) : null);
                BigDecimal rev = parseBigDecimalSafe(revIdx != -1 ? row.get(revIdx) : null);
                
                System.out.printf("Row %d parsed: name=%s, imp=%d, click=%d, rev=%s\n", i, originalText, imp, clk, rev);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Long parseLongSafe(String value) {
        if (value == null) return 0L;
        try {
            String clean = value.replace(",", "").replace("¥", "").replace("￥", "").replace("$", "").trim();
            if (clean.isEmpty()) return 0L;
            if (clean.contains(".")) {
                return new BigDecimal(clean).longValue();
            }
            return Long.valueOf(clean);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static BigDecimal parseBigDecimalSafe(String value) {
        if (value == null) return BigDecimal.ZERO;
        try {
            String clean = value.replace(",", "").replace("¥", "").replace("￥", "").replace("$", "").trim();
            if (clean.isEmpty()) return BigDecimal.ZERO;
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}