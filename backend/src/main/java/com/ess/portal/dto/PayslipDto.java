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
public class PayslipDto {
    private Integer id;
    private String employeeId;
    private String employeeName;
    private String departmentName;
    private String designationName;
    private Integer month;
    private Integer year;
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal transportAllowance;
    private BigDecimal medicalAllowance;
    private BigDecimal specialAllowance;
    private BigDecimal otherAllowances;
    private BigDecimal grossSalary;
    private BigDecimal pfEmployee;
    private BigDecimal pfEmployer;
    private BigDecimal esiEmployee;
    private BigDecimal esiEmployer;
    private BigDecimal professionalTax;
    private BigDecimal tds;
    private BigDecimal otherDeductions;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private LocalDate paidDate;
    private String status;
    private LocalDateTime createdAt;
}
