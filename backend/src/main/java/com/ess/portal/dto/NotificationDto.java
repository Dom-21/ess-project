package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Integer id;
    private String title;
    private String message;
    private String type;
    private String referenceType;
    private Integer referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
