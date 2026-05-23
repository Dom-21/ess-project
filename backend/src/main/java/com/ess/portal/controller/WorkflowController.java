package com.ess.portal.controller;

import com.ess.portal.dto.WorkflowActionRequest;
import com.ess.portal.entity.Employee;
import com.ess.portal.entity.WorkflowTask;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.EmployeeRepository;
import com.ess.portal.service.WorkflowEngineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {

    private final WorkflowEngineService workflowEngineService;
    private final EmployeeRepository employeeRepository;

    public WorkflowController(WorkflowEngineService workflowEngineService, EmployeeRepository employeeRepository) {
        this.workflowEngineService = workflowEngineService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping("/tasks/pending")
    public ResponseEntity<List<WorkflowTask>> getPendingInbox(Principal principal) {
        Employee approver = employeeRepository.findByUserEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for: " + principal.getName()));
        
        List<WorkflowTask> pendingInbox = workflowEngineService.getPendingInbox(approver);
        return ResponseEntity.ok(pendingInbox);
    }

    @PostMapping("/tasks/action")
    public ResponseEntity<Void> processTask(Principal principal, @Valid @RequestBody WorkflowActionRequest request) {
        Employee actor = employeeRepository.findByUserEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for: " + principal.getName()));

        workflowEngineService.processTask(request.getWorkflowTaskId(), request.getAction(), request.getComment(), actor);
        return ResponseEntity.ok().build();
    }
}
