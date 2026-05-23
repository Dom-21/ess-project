package com.ess.portal.controller;

import com.ess.portal.entity.Employee;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ExpenseClaimRepository expenseClaimRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final AssetRequestRepository assetRequestRepository;

    public DashboardController(EmployeeRepository employeeRepository,
                               LeaveRequestRepository leaveRequestRepository,
                               ExpenseClaimRepository expenseClaimRepository,
                               TravelRequestRepository travelRequestRepository,
                               AssetRequestRepository assetRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.expenseClaimRepository = expenseClaimRepository;
        this.travelRequestRepository = travelRequestRepository;
        this.assetRequestRepository = assetRequestRepository;
    }

    @GetMapping("/employee/summary")
    public ResponseEntity<Map<String, Object>> getEmployeeSummary(Principal principal) {
        Employee employee = employeeRepository.findByUserEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for: " + principal.getName()));

        Map<String, Object> summary = new HashMap<>();
        summary.put("pendingLeaves", leaveRequestRepository.findByEmployeeAndStatus(employee, "PENDING").size());
        summary.put("pendingExpenses", expenseClaimRepository.findByEmployeeAndStatus(employee, "PENDING").size());
        summary.put("pendingTravel", travelRequestRepository.findByEmployeeAndStatus(employee, "PENDING").size());
        summary.put("pendingAssets", assetRequestRepository.findByEmployeeAndStatus(employee, "PENDING").size());

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEmployees", employeeRepository.count());
        
        long pendingLeaves = leaveRequestRepository.findAll().stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus())).count();
        long pendingExpenses = expenseClaimRepository.findAll().stream()
                .filter(e -> "PENDING".equalsIgnoreCase(e.getStatus())).count();
        long pendingTravel = travelRequestRepository.findAll().stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus())).count();
        long pendingAssets = assetRequestRepository.findAll().stream()
                .filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count();

        summary.put("pendingLeaves", pendingLeaves);
        summary.put("pendingExpenses", pendingExpenses);
        summary.put("pendingTravel", pendingTravel);
        summary.put("pendingAssets", pendingAssets);

        return ResponseEntity.ok(summary);
    }
}
