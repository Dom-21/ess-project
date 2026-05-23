package com.ess.portal.controller;

import com.ess.portal.entity.Department;
import com.ess.portal.repository.DepartmentRepository;
import com.ess.portal.exception.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        if (department.getCode() == null || department.getCode().trim().isEmpty()) {
            throw new BadRequestException("Department code is required");
        }
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            throw new BadRequestException("Department name is required");
        }

        String formattedCode = department.getCode().trim().toUpperCase();
        String formattedName = department.getName().trim();

        if (departmentRepository.existsByCode(formattedCode)) {
            throw new BadRequestException("Department with this code already exists");
        }
        if (departmentRepository.existsByName(formattedName)) {
            throw new BadRequestException("Department with this name already exists");
        }

        department.setCode(formattedCode);
        department.setName(formattedName);
        department.setIsDeleted(false);
        department.setCreatedBy("HR_ADMIN");

        return ResponseEntity.ok(departmentRepository.save(department));
    }
}
