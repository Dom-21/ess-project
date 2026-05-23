package com.ess.portal.service;

import com.ess.portal.dto.*;
import com.ess.portal.entity.*;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkflowEngineService workflowEngineService;
    private final NotificationService notificationService;
    private final LeaveTypeRepository leaveTypeRepository;

    @Override
    @Transactional
    public LeaveRequestResponse applyLeave(String email, LeaveRequestDto request) {
        Employee employee = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }

        // Calculate working days (exclude weekends)
        long totalDays = calculateWorkingDays(request.getStartDate(), request.getEndDate());

        // Validate leave balance
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeId(employee, request.getLeaveTypeId())
                .orElseThrow(() -> new BadRequestException("Leave balance not found for the selected leave type"));

        BigDecimal allocated = BigDecimal.valueOf(balance.getAllocated());
        BigDecimal used = BigDecimal.valueOf(balance.getUsed() != null ? balance.getUsed() : 0);
        BigDecimal pending = BigDecimal
                .valueOf(balance.getPendingApproval() != null ? balance.getPendingApproval() : 0);
        BigDecimal available = allocated.subtract(used).subtract(pending);

        if (available.compareTo(BigDecimal.valueOf(totalDays)) < 0) {
            throw new BadRequestException("Insufficient leave balance. Available: " + available + " days.");
        }

        // Build and save the leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(balance.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setTotalDays(BigDecimal.valueOf(totalDays));
        leaveRequest.setReason(request.getReason());
        leaveRequest.setStatus("PENDING");
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Update pending balance
        int currentPending = balance.getPendingApproval() != null ? balance.getPendingApproval() : 0;
        balance.setPendingApproval(currentPending + (int) totalDays);
        leaveBalanceRepository.save(balance);

        // Trigger workflow
        try {
            workflowEngineService.initiate("LEAVE", leaveRequest.getId(), employee);
        } catch (Exception e) {
            // Workflow initiation is non-blocking
        }

        // Notify manager
        if (employee.getReportingManager() != null) {
            notificationService.sendNotification(
                    employee.getReportingManager().getId(),
                    "New Leave Request",
                    employee.getFirstName() + " " + employee.getLastName() + " has applied for leave from "
                            + request.getStartDate() + " to " + request.getEndDate(),
                    "LEAVE", "LEAVE_REQUEST", leaveRequest.getId());
        }

        return toResponse(leaveRequest);
    }

    @Override
    public LeaveRequestResponse getLeaveById(Integer id) {
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found: " + id));
        return toResponse(lr);
    }

    @Override
    public PagedResponse<LeaveRequestResponse> getMyLeaves(String email, Pageable pageable) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Page<LeaveRequest> page = leaveRequestRepository.findByEmployee(emp, pageable);
        return toPagedResponse(page);
    }

    @Override
    public PagedResponse<LeaveRequestResponse> getTeamLeaves(String managerEmail, Pageable pageable) {
        Employee manager = employeeRepository.findByUserEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        List<Employee> team = employeeRepository.findByReportingManager(manager);
        Page<LeaveRequest> page = leaveRequestRepository.findByEmployeeIn(team, pageable);
        return toPagedResponse(page);
    }

    @Override
    public PagedResponse<LeaveRequestResponse> getAllLeaves(Pageable pageable) {
        return toPagedResponse(leaveRequestRepository.findAll(pageable));
    }

    @Override
    @Transactional
    public void cancelLeave(Integer id, String email) {
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found: " + id));
        if (!lr.getEmployee().getUser().getEmail().equals(email)) {
            throw new BadRequestException("You can only cancel your own leave requests");
        }
        if (!"PENDING".equals(lr.getStatus()) && !"DRAFT".equals(lr.getStatus())) {
            throw new BadRequestException("Only PENDING or DRAFT leaves can be cancelled");
        }
        // Restore pending balance
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeId(lr.getEmployee(), lr.getLeaveType().getId())
                .orElse(null);
        if (balance != null) {
            int currentPending = balance.getPendingApproval() != null ? balance.getPendingApproval() : 0;
            int restoredPending = Math.max(0, currentPending - lr.getTotalDays().intValue());
            balance.setPendingApproval(restoredPending);
            leaveBalanceRepository.save(balance);
        }
        lr.setStatus("CANCELLED");
        leaveRequestRepository.save(lr);
    }

    @Override
    public List<LeaveBalanceDto> getMyLeaveBalances(String email) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return leaveBalanceRepository.findByEmployee(emp)
                .stream().map(this::toBalanceDto).collect(Collectors.toList());
    }

    private long calculateWorkingDays(LocalDate start, LocalDate end) {
        long count = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY)
                count++;
            current = current.plusDays(1);
        }
        return count == 0 ? 1 : count;
    }

    private LeaveRequestResponse toResponse(LeaveRequest lr) {
        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .employeeId(lr.getEmployee().getEmployeeId())
                .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
                .leaveTypeName(lr.getLeaveType().getName())
                .leaveTypeCode(lr.getLeaveType().getCode())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .totalDays(lr.getTotalDays())
                .reason(lr.getReason())
                .status(lr.getStatus())
                .currentApprover(workflowEngineService.getCurrentApprover("LEAVE", lr.getId()))
                .approverRemarks(workflowEngineService.getLatestRemarks("LEAVE", lr.getId()))
                .createdAt(lr.getCreatedAt())
                .updatedAt(lr.getUpdatedAt())
                .build();
    }

    private LeaveBalanceDto toBalanceDto(LeaveBalance lb) {
        BigDecimal allocated = BigDecimal.valueOf(lb.getAllocated());
        BigDecimal used = BigDecimal.valueOf(lb.getUsed() != null ? lb.getUsed() : 0);
        BigDecimal pending = BigDecimal.valueOf(lb.getPendingApproval() != null ? lb.getPendingApproval() : 0);
        BigDecimal available = allocated.subtract(used).subtract(pending);
        return LeaveBalanceDto.builder()
                .id(lb.getId())
                .leaveTypeId(lb.getLeaveType().getId())
                .leaveTypeCode(lb.getLeaveType().getCode())
                .leaveTypeName(lb.getLeaveType().getName())
                .totalAllocated(allocated)
                .used(used)
                .pending(pending)
                .available(available)
                .year(LocalDate.now().getYear())
                .build();
    }

    private PagedResponse<LeaveRequestResponse> toPagedResponse(Page<LeaveRequest> page) {
        return PagedResponse.<LeaveRequestResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }

    @Override
    public List<LeaveType> getAllLeaveTypes() {
        return leaveTypeRepository.findAll();
    }

    @Override
    @Transactional
    public LeaveType createLeaveType(LeaveType leaveType) {
        if (leaveType.getName() == null || leaveType.getName().trim().isEmpty()) {
            throw new BadRequestException("Leave Type name is required");
        }
        if (leaveType.getCode() == null || leaveType.getCode().trim().isEmpty()) {
            throw new BadRequestException("Leave Type code is required");
        }
        if (leaveType.getAnnualLimit() == null || leaveType.getAnnualLimit() < 0) {
            throw new BadRequestException("Valid annual limit is required");
        }

        String code = leaveType.getCode().trim().toUpperCase();
        String name = leaveType.getName().trim();

        if (leaveTypeRepository.existsByCode(code)) {
            throw new BadRequestException("Leave Type with this code already exists");
        }
        if (leaveTypeRepository.existsByName(name)) {
            throw new BadRequestException("Leave Type with this name already exists");
        }

        leaveType.setCode(code);
        leaveType.setName(name);
        leaveType.setIsDeleted(false);
        leaveType.setCreatedBy("HR_ADMIN");

        LeaveType saved = leaveTypeRepository.save(leaveType);

        // Auto-seed balances for all existing employees
        List<Employee> allEmployees = employeeRepository.findAll();
        for (Employee emp : allEmployees) {
            if (!leaveBalanceRepository.findByEmployeeAndLeaveType(emp, saved).isPresent()) {
                LeaveBalance balance = new LeaveBalance();
                balance.setEmployee(emp);
                balance.setLeaveType(saved);
                balance.setAllocated(saved.getAnnualLimit());
                balance.setUsed(0);
                balance.setPendingApproval(0);
                balance.setIsDeleted(false);
                balance.setCreatedBy("HR_ADMIN");
                leaveBalanceRepository.save(balance);
            }
        }

        return saved;
    }

    @Override
    @Transactional
    public LeaveType updateLeaveType(Integer id, LeaveType leaveTypeDetails) {
        LeaveType existing = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave Type not found with ID: " + id));

        if (leaveTypeDetails.getName() == null || leaveTypeDetails.getName().trim().isEmpty()) {
            throw new BadRequestException("Leave Type name is required");
        }
        if (leaveTypeDetails.getCode() == null || leaveTypeDetails.getCode().trim().isEmpty()) {
            throw new BadRequestException("Leave Type code is required");
        }
        if (leaveTypeDetails.getAnnualLimit() == null || leaveTypeDetails.getAnnualLimit() < 0) {
            throw new BadRequestException("Valid annual limit is required");
        }

        String code = leaveTypeDetails.getCode().trim().toUpperCase();
        String name = leaveTypeDetails.getName().trim();

        if (!existing.getCode().equalsIgnoreCase(code) && leaveTypeRepository.existsByCode(code)) {
            throw new BadRequestException("Leave Type with this code already exists");
        }
        if (!existing.getName().equalsIgnoreCase(name) && leaveTypeRepository.existsByName(name)) {
            throw new BadRequestException("Leave Type with this name already exists");
        }

        existing.setName(name);
        existing.setCode(code);
        existing.setAnnualLimit(leaveTypeDetails.getAnnualLimit());
        existing.setCarryForwardLimit(leaveTypeDetails.getCarryForwardLimit() != null ? leaveTypeDetails.getCarryForwardLimit() : 0);
        existing.setUpdatedBy("HR_ADMIN");

        return leaveTypeRepository.save(existing);
    }

    @Override
    @Transactional
    public void allocateLeaveBalance(LeaveAllocationDto allocation) {
        if (allocation.getEmployeeId() == null) {
            throw new BadRequestException("Employee ID is required");
        }
        if (allocation.getLeaveTypeId() == null) {
            throw new BadRequestException("Leave Type ID is required");
        }
        if (allocation.getAllocated() == null || allocation.getAllocated() < 0) {
            throw new BadRequestException("Valid allocation days count is required");
        }

        Employee employee = employeeRepository.findById(allocation.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + allocation.getEmployeeId()));

        LeaveType leaveType = leaveTypeRepository.findById(allocation.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave Type not found with ID: " + allocation.getLeaveTypeId()));

        LeaveBalance balance = leaveBalanceRepository.findByEmployeeAndLeaveType(employee, leaveType)
                .orElseGet(() -> {
                    LeaveBalance b = new LeaveBalance();
                    b.setEmployee(employee);
                    b.setLeaveType(leaveType);
                    b.setUsed(0);
                    b.setPendingApproval(0);
                    b.setIsDeleted(false);
                    b.setCreatedBy("HR_ADMIN");
                    return b;
                });

        balance.setAllocated(allocation.getAllocated());
        leaveBalanceRepository.save(balance);
    }
}
