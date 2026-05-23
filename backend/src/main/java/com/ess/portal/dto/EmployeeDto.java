package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDto {
    private Integer id;
    private String employeeId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private LocalDate joiningDate;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String profileImageUrl;
    private String departmentName;
    private Integer departmentId;
    private String designationName;
    private Integer designationId;
    private String reportingManagerName;
    private String reportingManagerEmployeeId;
    private Integer reportingManagerId;
    private String status;
}
