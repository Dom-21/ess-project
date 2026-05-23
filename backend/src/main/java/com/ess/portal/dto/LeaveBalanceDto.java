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
public class LeaveBalanceDto {
    private Integer id;
    private Integer leaveTypeId;
    private String leaveTypeCode;
    private String leaveTypeName;
    private BigDecimal totalAllocated;
    private BigDecimal used;
    private BigDecimal pending;
    private BigDecimal available;
    private Integer year;
}
