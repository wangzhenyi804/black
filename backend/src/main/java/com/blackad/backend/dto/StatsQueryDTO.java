package com.blackad.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StatsQueryDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private Long codeSlotId;
    private String codeSlotName;
    private String terminal;
    private String type;
    
    // Security field
    private Long userId;

    // For pagination
    private int page = 1;
    private int size = 10;
}
