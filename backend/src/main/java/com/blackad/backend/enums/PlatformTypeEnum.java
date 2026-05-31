package com.blackad.backend.enums;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 平台类型固定枚举。
 * 当前业务不使用字典表，所有可选平台在此处集中维护。
 */
public enum PlatformTypeEnum {
    QIHOO_360("360", "360"),
    BAIDU("baidu", "百度"),
    GOOGLE("google", "Google"),
    SM("sm", "神马");

    private final String code;
    private final String label;

    PlatformTypeEnum(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static boolean isValid(String code) {
        if (code == null || code.isBlank()) {
            return true;
        }
        return Arrays.stream(values()).anyMatch(type -> type.code.equals(code));
    }

    public static List<Map<String, String>> options() {
        return Arrays.stream(values())
                .map(type -> Map.of("value", type.code, "label", type.label))
                .toList();
    }
}
