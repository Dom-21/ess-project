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
public class AttendanceRecordDto {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private String shiftName;
    private Boolean isLate;
    private Boolean isWfh;
    private Double latitude;
    private Double longitude;
    private String status;
    private Double hoursWorked;
}
