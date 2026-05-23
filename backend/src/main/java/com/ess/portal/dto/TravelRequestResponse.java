package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelRequestResponse {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private String purpose;
    private String destination;
    private LocalDate travelDate;
    private LocalDate returnDate;
    private String modeOfTransport;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private String additionalNotes;
    private String status;
    private String workflowInstanceId;
    private String currentApprover;
    private String approverRemarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
