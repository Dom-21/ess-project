package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimResponse {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private String title;
    private LocalDate claimDate;
    private String description;
    private BigDecimal totalAmount;
    private String status;
    private String workflowInstanceId;
    private String currentApprover;
    private String approverRemarks;
    private List<ExpenseItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
