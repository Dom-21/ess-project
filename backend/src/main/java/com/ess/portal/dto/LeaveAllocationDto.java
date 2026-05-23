package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveAllocationDto {
    private Integer employeeId;
    private Integer leaveTypeId;
    private Integer allocated;
}
