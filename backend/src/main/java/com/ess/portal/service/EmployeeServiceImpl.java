package com.ess.portal.service;

import com.ess.portal.dto.*;
import com.ess.portal.entity.Department;
import com.ess.portal.entity.Employee;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.DepartmentRepository;
import com.ess.portal.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public EmployeeDto getMyProfile(String email) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for: " + email));
        return toDto(emp);
    }

    @Override
    public EmployeeDto getEmployeeById(Integer id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return toDto(emp);
    }

    @Override
    public EmployeeDto getEmployeeByEmployeeId(String employeeId) {
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));
        return toDto(emp);
    }

    @Override
    @Transactional
    public EmployeeDto updateMyProfile(String email, EmployeeUpdateRequest request) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for: " + email));

        if (request.getFirstName() != null)
            emp.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            emp.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null)
            emp.setPhoneNumber(request.getPhoneNumber());
        if (request.getDateOfBirth() != null)
            emp.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null)
            emp.setGender(request.getGender());
        if (request.getAddress() != null)
            emp.setAddress(request.getAddress());
        if (request.getProfileImageUrl() != null)
            emp.setProfileImageUrl(request.getProfileImageUrl());

        return toDto(employeeRepository.save(emp));
    }

    @Override
    public PagedResponse<EmployeeDto> getAllEmployees(Pageable pageable) {
        Page<Employee> page = employeeRepository.findAll(pageable);
        return toPagedResponse(page);
    }

    @Override
    public List<EmployeeDto> getTeamMembers(String managerEmail) {
        Employee manager = employeeRepository.findByUserEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found: " + managerEmail));
        return employeeRepository.findByReportingManager(manager)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDto> searchEmployees(String query) {
        return employeeRepository.searchByName(query)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private EmployeeDto toDto(Employee emp) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(emp.getId());
        dto.setEmployeeId(emp.getEmployeeId());
        dto.setFirstName(emp.getFirstName());
        dto.setLastName(emp.getLastName());
        dto.setEmail(emp.getUser() != null ? emp.getUser().getEmail() : null);
        dto.setPhoneNumber(emp.getPhoneNumber());
        dto.setJoiningDate(emp.getJoiningDate());
        dto.setDateOfBirth(emp.getDateOfBirth());
        dto.setGender(emp.getGender());
        dto.setAddress(emp.getAddress());
        dto.setProfileImageUrl(emp.getProfileImageUrl());
        if (emp.getDepartment() != null) {
            dto.setDepartmentId(emp.getDepartment().getId());
            dto.setDepartmentName(emp.getDepartment().getName());
        }
        if (emp.getDesignation() != null) {
            dto.setDesignationId(emp.getDesignation().getId());
            dto.setDesignationName(emp.getDesignation().getTitle());
        }
        if (emp.getReportingManager() != null) {
            dto.setReportingManagerId(emp.getReportingManager().getId());
            dto.setReportingManagerEmployeeId(emp.getReportingManager().getEmployeeId());
            dto.setReportingManagerName(
                    emp.getReportingManager().getFirstName() + " " + emp.getReportingManager().getLastName());
        }
        dto.setStatus(emp.getUser() != null && emp.getUser().getIsActive() ? "ACTIVE" : "INACTIVE");
        return dto;
    }

    private PagedResponse<EmployeeDto> toPagedResponse(Page<Employee> page) {
        return PagedResponse.<EmployeeDto>builder()
                .content(page.getContent().stream().map(this::toDto).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional
    public EmployeeDto assignManagerAndDepartment(Integer employeeId, EmployeeAssignmentRequest request) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Department not found with id: " + request.getDepartmentId()));
            emp.setDepartment(dept);
        } else {
            emp.setDepartment(null);
        }

        if (request.getReportingManagerId() != null) {
            if (request.getReportingManagerId().equals(employeeId)) {
                throw new BadRequestException("An employee cannot be their own manager");
            }
            Employee manager = employeeRepository.findById(request.getReportingManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Reporting manager not found with id: " + request.getReportingManagerId()));
            emp.setReportingManager(manager);
        } else {
            emp.setReportingManager(null);
        }

        return toDto(employeeRepository.save(emp));
    }

    @Override
    public List<EmployeeDto> getAllEmployeesList() {
        return employeeRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
