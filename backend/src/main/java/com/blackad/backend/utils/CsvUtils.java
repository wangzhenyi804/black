package com.blackad.backend.utils;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

public class CsvUtils {

    /**
     * 将对象列表转换为 CSV 字符串
     */
    public static <T> String toCsv(List<T> list, Class<T> clazz) {
        if (list == null || list.isEmpty()) {
            return "";
        }

        Field[] fields = clazz.getDeclaredFields();
        String header = Arrays.stream(fields)
                .map(Field::getName)
                .collect(Collectors.joining(","));

        String body = list.stream().map(item -> {
            return Arrays.stream(fields).map(field -> {
                try {
                    field.setAccessible(true);
                    Object value = field.get(item);
                    if (value == null) return "";
                    String str = value.toString();
                    // 处理逗号和引号
                    if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
                        str = "\"" + str.replace("\"", "\"\"") + "\"";
                    }
                    return str;
                } catch (IllegalAccessException e) {
                    return "";
                }
            }).collect(Collectors.joining(","));
        }).collect(Collectors.joining("\n"));

        return header + "\n" + body;
    }

    /**
     * 将 CSV 字符串解析为 Map 列表（方便动态处理）
     */
    public static List<Map<String, String>> parseCsv(String csvContent) {
        List<Map<String, String>> result = new ArrayList<>();
        if (csvContent == null || csvContent.trim().isEmpty()) {
            return result;
        }

        // Remove BOM if present
        if (csvContent.startsWith("\uFEFF")) {
            csvContent = csvContent.substring(1);
        }

        String[] lines = csvContent.split("\n");
        if (lines.length < 2) return result;

        String[] headers = parseCsvLine(lines[0]);
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].trim().isEmpty()) continue;
            String[] values = parseCsvLine(lines[i]);
            Map<String, String> row = new HashMap<>();
            for (int j = 0; j < headers.length; j++) {
                if (j < values.length) {
                    row.put(headers[j].trim(), values[j].trim());
                }
            }
            result.add(row);
        }
        return result;
    }

    private static String[] parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    // Double quotes inside quoted string -> single quote
                    sb.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        return values.toArray(new String[0]);
    }
}
