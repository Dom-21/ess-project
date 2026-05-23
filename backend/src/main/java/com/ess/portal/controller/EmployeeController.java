package com.ess.portal.controller;

import com.ess.portal.dto.EmployeeAssignmentRequest;
import com.ess.portal.dto.EmployeeDto;
import com.ess.portal.dto.EmployeeUpdateRequest;
import com.ess.portal.dto.PagedResponse;
import com.ess.portal.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/me")
    public ResponseEntity<EmployeeDto> getMyProfile(Principal principal) {
        return ResponseEntity.ok(employeeService.getMyProfile(principal.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<EmployeeDto> updateMyProfile(Principal principal, @Valid @RequestBody EmployeeUpdateRequest request) {
        return ResponseEntity.ok(employeeService.updateMyProfile(principal.getName(), request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN', 'REPORTING_MANAGER')")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable Integer id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @GetMapping("/emp/{employeeId}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN', 'REPORTING_MANAGER')")
    public ResponseEntity<EmployeeDto> getEmployeeByEmployeeId(@PathVariable String employeeId) {
        return ResponseEntity.ok(employeeService.getEmployeeByEmployeeId(employeeId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<PagedResponse<EmployeeDto>> getAllEmployees(Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
    }

    @GetMapping("/team")
    public ResponseEntity<List<EmployeeDto>> getTeamMembers(Principal principal) {
        return ResponseEntity.ok(employeeService.getTeamMembers(principal.getName()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<EmployeeDto>> searchEmployees(@RequestParam String query) {
        return ResponseEntity.ok(employeeService.searchEmployees(query));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<EmployeeDto> assignManagerAndDepartment(@PathVariable Integer id, @RequestBody EmployeeAssignmentRequest request) {
        return ResponseEntity.ok(employeeService.assignManagerAndDepartment(id, request));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<List<EmployeeDto>> getAllEmployeesList() {
        return ResponseEntity.ok(employeeService.getAllEmployeesList());
    }
}
