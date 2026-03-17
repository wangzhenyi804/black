package com.blackad.backend.utils;

import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class CsvUtilsTest {

    @Test
    void testToCsv() {
        List<TestBean> list = new ArrayList<>();
        list.add(new TestBean("name1", "domain1"));
        list.add(new TestBean("name2", "domain,with,comma"));

        String csv = CsvUtils.toCsv(list, TestBean.class);
        assertTrue(csv.contains("name,domain"));
        assertTrue(csv.contains("name1,domain1"));
        assertTrue(csv.contains("name2,\"domain,with,comma\""));
    }

    @Test
    void testParseCsv() {
        String csv = "name,domain\nname1,domain1\nname2,\"domain,with,comma\"";
        List<Map<String, String>> data = CsvUtils.parseCsv(csv);

        assertEquals(2, data.size());
        assertEquals("name1", data.get(0).get("name"));
        assertEquals("domain1", data.get(0).get("domain"));
        assertEquals("name2", data.get(1).get("name"));
        assertEquals("domain,with,comma", data.get(1).get("domain"));
    }

    public static class TestBean {
        private String name;
        private String domain;

        public TestBean(String name, String domain) {
            this.name = name;
            this.domain = domain;
        }
    }
}
