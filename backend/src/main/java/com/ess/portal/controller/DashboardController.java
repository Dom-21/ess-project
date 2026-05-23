package com.ess.portal.controller;

import com.ess.portal.entity.*;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        // Advanced Insights: Unassigned Headcounts
        long unassignedManager = employeeRepository.findAll().stream()
                .filter(e -> e.getReportingManager() == null && e.getDesignation() != null && !"CEO".equalsIgnoreCase(e.getDesignation().getCode()))
                .count();
        long unassignedDept = employeeRepository.findAll().stream()
                .filter(e -> e.getDepartment() == null)
                .count();
        summary.put("unassignedManagerCount", unassignedManager);
        summary.put("unassignedDeptCount", unassignedDept);

        // Advanced Insights: Department Headcount Breakdown
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<String, Long> deptDist = allEmployees.stream()
                .filter(e -> e.getDepartment() != null)
                .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), Collectors.counting()));
        summary.put("departmentDist", deptDist);

        // Advanced Insights: Recent Company-Wide Requests Feed (Latest 5)
        List<Map<String, Object>> recentRequests = new ArrayList<>();

        leaveRequestRepository.findAll().forEach(l -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", l.getId());
            m.put("employeeName", l.getEmployee().getFirstName() + " " + l.getEmployee().getLastName());
            m.put("type", "LEAVE");
            m.put("summary", l.getTotalDays() + " Days (" + l.getLeaveType().getCode() + ")");
            m.put("status", l.getStatus());
            m.put("createdAt", l.getCreatedAt());
            recentRequests.add(m);
        });

        expenseClaimRepository.findAll().forEach(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", e.getId());
            m.put("employeeName", e.getEmployee().getFirstName() + " " + e.getEmployee().getLastName());
            m.put("type", "EXPENSE");
            m.put("summary", "₹" + e.getTotalAmount());
            m.put("status", e.getStatus());
            m.put("createdAt", e.getCreatedAt());
            recentRequests.add(m);
        });

        travelRequestRepository.findAll().forEach(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("employeeName", t.getEmployee().getFirstName() + " " + t.getEmployee().getLastName());
            m.put("type", "TRAVEL");
            m.put("summary", t.getDestination() + " (₹" + t.getEstimatedCost() + ")");
            m.put("status", t.getStatus());
            m.put("createdAt", t.getCreatedAt());
            recentRequests.add(m);
        });

        assetRequestRepository.findAll().forEach(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("employeeName", a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName());
            m.put("type", "ASSET");
            m.put("summary", a.getCategory() + " request");
            m.put("status", a.getStatus());
            m.put("createdAt", a.getCreatedAt());
            recentRequests.add(m);
        });

        List<Map<String, Object>> sortedRecent = recentRequests.stream()
                .filter(m -> m.get("createdAt") != null)
                .sorted((m1, m2) -> ((LocalDateTime) m2.get("createdAt")).compareTo((LocalDateTime) m1.get("createdAt")))
                .limit(5)
                .collect(Collectors.toList());
        summary.put("recentRequests", sortedRecent);

        return ResponseEntity.ok(summary);
    }
}
