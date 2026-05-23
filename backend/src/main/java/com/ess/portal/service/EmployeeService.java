package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EmployeeService {
    EmployeeDto getMyProfile(String email);
    EmployeeDto getEmployeeById(Integer id);
    EmployeeDto getEmployeeByEmployeeId(String employeeId);
    EmployeeDto updateMyProfile(String email, EmployeeUpdateRequest request);
    PagedResponse<EmployeeDto> getAllEmployees(Pageable pageable);
    List<EmployeeDto> getTeamMembers(String managerEmail);
    List<EmployeeDto> searchEmployees(String query);
    EmployeeDto assignManagerAndDepartment(Integer employeeId, EmployeeAssignmentRequest request);
    List<EmployeeDto> getAllEmployeesList();
}
