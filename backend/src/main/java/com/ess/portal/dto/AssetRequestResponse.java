package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequestResponse {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private Integer assetId;
    private String assetName;
    private String assetTag;
    private String assetType;
    private String purpose;
    private String additionalNotes;
    private String status;
    private LocalDate assignedDate;
    private LocalDate returnedDate;
    private String workflowInstanceId;
    private String currentApprover;
    private String approverRemarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
