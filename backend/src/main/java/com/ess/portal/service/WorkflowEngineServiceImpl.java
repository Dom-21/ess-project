package com.ess.portal.service;

import com.ess.portal.constants.WorkflowStatus;
import com.ess.portal.entity.*;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class WorkflowEngineServiceImpl implements WorkflowEngineService {

    @Autowired
    private WorkflowConfigRepository workflowConfigRepository;

    @Autowired
    private WorkflowStepConfigRepository workflowStepConfigRepository;

    @Autowired
    private WorkflowInstanceRepository workflowInstanceRepository;

    @Autowired
    private WorkflowTaskRepository workflowTaskRepository;

    @Autowired
    private WorkflowActionLogRepository workflowActionLogRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private TravelRequestRepository travelRequestRepository;

    @Autowired
    private ExpenseClaimRepository expenseClaimRepository;

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private AssetRequestRepository assetRequestRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void initiate(String entityType, Integer entityId, Employee maker) {
        WorkflowConfig config = workflowConfigRepository.findByEntityType(entityType)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow configuration not found for: " + entityType));

        if (!config.getIsActive()) {
            throw new BadRequestException("Workflow config is inactive for: " + entityType);
        }

        // Check if an instance already exists
        Optional<WorkflowInstance> existingInstance = workflowInstanceRepository
                .findByWorkflowConfigEntityTypeAndEntityId(entityType, entityId);
        if (existingInstance.isPresent()) {
            throw new BadRequestException("Workflow already initiated for this request.");
        }

        // Create Instance
        WorkflowInstance instance = new WorkflowInstance();
        instance.setWorkflowConfig(config);
        instance.setEntityId(entityId);
        instance.setStatus("PENDING");
        instance.setCurrentStep(1);
        instance = workflowInstanceRepository.save(instance);

        // Fetch Level 1 Step config
        WorkflowStepConfig stepConfig = workflowStepConfigRepository
                .findByWorkflowConfigAndStepNumber(config, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Step 1 configuration not found for: " + entityType));

        // Resolve Level 1 Approver
        Employee approver = resolveApprover(stepConfig.getApproverRole(), maker);

        // Create Task
        WorkflowTask task = new WorkflowTask();
        task.setWorkflowInstance(instance);
        task.setStepNumber(1);
        task.setAssignedApprover(approver);
        task.setAssignedRole(stepConfig.getApproverRole());
        task.setStatus("PENDING");
        workflowTaskRepository.save(task);

        // Create Action Log for submission
        WorkflowActionLog log = new WorkflowActionLog();
        log.setWorkflowInstance(instance);
        log.setStepNumber(1);
        log.setAction("SUBMIT");
        log.setActor(maker);
        log.setRemarks("Request submitted and routed to level 1.");
        workflowActionLogRepository.save(log);

        // Send Notification to Approver
        sendNotification(approver.getUser().getEmail(), 
                "Pending Approval: " + entityType, 
                "A new " + entityType + " request from " + maker.getFirstName() + " " + maker.getLastName() + " is pending your approval.");
    }

    @Override
    @Transactional
    public void processTask(Integer taskId, String action, String remarks, Employee actor) {
        WorkflowTask task = workflowTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow task not found."));

        if (!"PENDING".equalsIgnoreCase(task.getStatus())) {
            throw new BadRequestException("Task is already completed or processed.");
        }

        // Enforce assigned approver constraint
        if (task.getAssignedApprover() != null && !task.getAssignedApprover().getId().equals(actor.getId())) {
            throw new BadRequestException("You are not authorized to process this task.");
        }

        WorkflowInstance instance = task.getWorkflowInstance();
        String entityType = instance.getWorkflowConfig().getEntityType();

        // Enforce MAKER-CHECKER rule
        Employee maker = getMaker(instance);
        if (maker.getId().equals(actor.getId())) {
            throw new BadRequestException("Maker-Checker Violation: You cannot approve or process your own request.");
        }

        // Create Action Log
        WorkflowActionLog actionLog = new WorkflowActionLog();
        actionLog.setWorkflowInstance(instance);
        actionLog.setStepNumber(task.getStepNumber());
        actionLog.setAction(action);
        actionLog.setActor(actor);
        actionLog.setRemarks(remarks);
        workflowActionLogRepository.save(actionLog);

        if ("REJECT".equalsIgnoreCase(action)) {
            task.setStatus("COMPLETED");
            workflowTaskRepository.save(task);

            instance.setStatus("REJECTED");
            workflowInstanceRepository.save(instance);

            // Update Target Request Entity
            updateTargetEntityStatus(entityType, instance.getEntityId(), "REJECTED");

            // Notify Maker
            sendNotification(maker.getUser().getEmail(), 
                    "Request Rejected: " + entityType, 
                    "Your " + entityType + " request has been rejected by " + actor.getFirstName() + ". Remarks: " + remarks);

        } else if ("APPROVE".equalsIgnoreCase(action)) {
            task.setStatus("COMPLETED");
            workflowTaskRepository.save(task);

            // Check if there is a next step config
            Optional<WorkflowStepConfig> nextStepConfig = workflowStepConfigRepository
                    .findByWorkflowConfigAndStepNumber(instance.getWorkflowConfig(), task.getStepNumber() + 1);

            if (nextStepConfig.isPresent()) {
                // Multi-stage approval triggers next level
                WorkflowStepConfig step = nextStepConfig.get();
                Employee nextApprover = resolveApprover(step.getApproverRole(), maker);

                instance.setCurrentStep(step.getStepNumber());
                workflowInstanceRepository.save(instance);

                // Create next Task
                WorkflowTask nextTask = new WorkflowTask();
                nextTask.setWorkflowInstance(instance);
                nextTask.setStepNumber(step.getStepNumber());
                nextTask.setAssignedApprover(nextApprover);
                nextTask.setAssignedRole(step.getApproverRole());
                nextTask.setStatus("PENDING");
                workflowTaskRepository.save(nextTask);

                // Notify next Approver
                sendNotification(nextApprover.getUser().getEmail(), 
                        "Pending Approval: " + entityType, 
                        "A request for " + entityType + " from " + maker.getFirstName() + " has passed level " + task.getStepNumber() + " and requires your review.");
            } else {
                // Final approval reached
                instance.setStatus("APPROVED");
                workflowInstanceRepository.save(instance);

                updateTargetEntityStatus(entityType, instance.getEntityId(), "APPROVED");

                // Execute final action triggers (like leave balance deductions!)
                executeFinalActionTriggers(entityType, instance.getEntityId());

                // Notify Maker
                sendNotification(maker.getUser().getEmail(), 
                        "Request Approved: " + entityType, 
                        "Congratulations! Your " + entityType + " request has been fully approved.");
            }
        }
    }

    @Override
    @Transactional
    public void cancel(String entityType, Integer entityId, Employee maker) {
        WorkflowInstance instance = workflowInstanceRepository
                .findByWorkflowConfigEntityTypeAndEntityId(entityType, entityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow instance not found for cancellation."));

        if ("APPROVED".equalsIgnoreCase(instance.getStatus()) || "REJECTED".equalsIgnoreCase(instance.getStatus())) {
            throw new BadRequestException("Cannot cancel a completed workflow.");
        }

        instance.setStatus("CANCELLED");
        workflowInstanceRepository.save(instance);

        // Cancel all pending tasks
        List<WorkflowTask> pendingTasks = workflowTaskRepository.findByAssignedApproverAndStatus(null, "PENDING"); // We will just query standard filter
        // Better: standard scan of tasks for this instance
        workflowTaskRepository.findAll().stream()
                .filter(t -> t.getWorkflowInstance().getId().equals(instance.getId()) && "PENDING".equalsIgnoreCase(t.getStatus()))
                .forEach(t -> {
                    t.setStatus("CANCELLED");
                    workflowTaskRepository.save(t);
                });

        updateTargetEntityStatus(entityType, entityId, "CANCELLED");

        // Action Log
        WorkflowActionLog log = new WorkflowActionLog();
        log.setWorkflowInstance(instance);
        log.setStepNumber(instance.getCurrentStep());
        log.setAction("CANCEL");
        log.setActor(maker);
        log.setRemarks("Cancelled by creator.");
        workflowActionLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTask> getPendingInbox(Employee approver) {
        List<WorkflowTask> tasks = workflowTaskRepository.findByAssignedApproverAndStatus(approver, "PENDING");
        
        // Also support fetching generic role-assigned tasks matching the approver's corporate roles
        approver.getUser().getRoles().forEach(role -> {
            List<WorkflowTask> roleTasks = workflowTaskRepository.findByAssignedRoleAndStatus(role.getName(), "PENDING");
            roleTasks.stream()
                .filter(t -> t.getAssignedApprover() == null) // only generic ones
                .forEach(tasks::add);
        });

        // Ensure Maker-Checker separation (don't display tasks where the approver is the maker of the request)
        List<WorkflowTask> filteredTasks = new ArrayList<>();
        for (WorkflowTask t : tasks) {
            Employee maker = getMaker(t.getWorkflowInstance());
            if (!maker.getId().equals(approver.getId())) {
                filteredTasks.add(t);
            }
        }
        return filteredTasks;
    }

    // Resolves manager dynamically or falls back to custom seeded role holders
    private Employee resolveApprover(String role, Employee maker) {
        if ("REPORTING_MANAGER".equalsIgnoreCase(role)) {
            if (maker.getReportingManager() == null) {
                // Root employee CEO: Fallback to itself or Super Admin
                return maker;
            }
            return maker.getReportingManager();
        }

        // Resolving general admin seeded roles: IT_ADMIN, HR_ADMIN, FINANCE_MANAGER
        return employeeRepository.findAll().stream()
                .filter(e -> e.getUser() != null && e.getUser().getRoles().stream()
                        .anyMatch(r -> r.getName().equalsIgnoreCase(role)))
                .findFirst()
                .orElse(maker.getReportingManager() != null ? maker.getReportingManager() : maker);
    }

    @Override
    @Transactional(readOnly = true)
    public String getCurrentApprover(String entityType, Integer entityId) {
        Optional<WorkflowInstance> wfOpt = workflowInstanceRepository
                .findByWorkflowConfigEntityTypeAndEntityId(entityType, entityId);
        if (wfOpt.isEmpty()) {
            return "N/A";
        }
        WorkflowInstance instance = wfOpt.get();
        if (!"PENDING".equalsIgnoreCase(instance.getStatus())) {
            return instance.getStatus(); // APPROVED, REJECTED, CANCELLED
        }

        // Find active pending task
        return workflowTaskRepository.findAll().stream()
                .filter(t -> t.getWorkflowInstance().getId().equals(instance.getId()) && "PENDING".equalsIgnoreCase(t.getStatus()))
                .findFirst()
                .map(t -> {
                    if (t.getAssignedApprover() != null) {
                        return t.getAssignedApprover().getFirstName() + " " + t.getAssignedApprover().getLastName();
                    } else if (t.getAssignedRole() != null) {
                        return t.getAssignedRole();
                    }
                    return "Pending Approver";
                })
                .orElse("Pending");
    }

    @Override
    @Transactional(readOnly = true)
    public String getLatestRemarks(String entityType, Integer entityId) {
        Optional<WorkflowInstance> wfOpt = workflowInstanceRepository
                .findByWorkflowConfigEntityTypeAndEntityId(entityType, entityId);
        if (wfOpt.isEmpty()) {
            return "";
        }
        WorkflowInstance instance = wfOpt.get();

        // Find latest action log with remarks (excluding SUBMIT unless it has custom remarks)
        return workflowActionLogRepository.findByWorkflowInstanceOrderByStepNumberAsc(instance).stream()
                .filter(log -> log.getRemarks() != null && !log.getRemarks().trim().isEmpty() && !"SUBMIT".equalsIgnoreCase(log.getAction()))
                .reduce((first, second) -> second) // get the last one (latest)
                .map(log -> log.getRemarks() + " (by " + log.getActor().getFirstName() + " " + log.getActor().getLastName() + ")")
                .orElse("");
    }

    private Employee getMaker(WorkflowInstance instance) {
        // First try action logs
        Optional<Employee> actorOpt = workflowActionLogRepository.findByWorkflowInstanceOrderByStepNumberAsc(instance).stream()
                .filter(log -> "SUBMIT".equalsIgnoreCase(log.getAction()))
                .map(WorkflowActionLog::getActor)
                .findFirst();
        if (actorOpt.isPresent()) {
            return actorOpt.get();
        }

        // Fallback: Query the target entity to find the employee/maker
        String entityType = instance.getWorkflowConfig().getEntityType();
        Integer entityId = instance.getEntityId();

        if ("LEAVE".equalsIgnoreCase(entityType)) {
            return leaveRequestRepository.findById(entityId)
                    .map(LeaveRequest::getEmployee)
                    .orElseThrow(() -> new ResourceNotFoundException("Maker not found for Leave entity ID: " + entityId));
        } else if ("TRAVEL".equalsIgnoreCase(entityType)) {
            return travelRequestRepository.findById(entityId)
                    .map(TravelRequest::getEmployee)
                    .orElseThrow(() -> new ResourceNotFoundException("Maker not found for Travel entity ID: " + entityId));
        } else if ("EXPENSE".equalsIgnoreCase(entityType)) {
            return expenseClaimRepository.findById(entityId)
                    .map(ExpenseClaim::getEmployee)
                    .orElseThrow(() -> new ResourceNotFoundException("Maker not found for Expense entity ID: " + entityId));
        } else if ("ASSET".equalsIgnoreCase(entityType)) {
            return assetRequestRepository.findById(entityId)
                    .map(AssetRequest::getEmployee)
                    .orElseThrow(() -> new ResourceNotFoundException("Maker not found for Asset entity ID: " + entityId));
        } else if ("REIMBURSEMENT".equalsIgnoreCase(entityType)) {
            return reimbursementRepository.findById(entityId)
                    .map(Reimbursement::getEmployee)
                    .orElseThrow(() -> new ResourceNotFoundException("Maker not found for Reimbursement entity ID: " + entityId));
        }

        throw new ResourceNotFoundException("Initiator maker of this workflow could not be found.");
    }

    private void updateTargetEntityStatus(String entityType, Integer entityId, String status) {
        if ("LEAVE".equalsIgnoreCase(entityType)) {
            LeaveRequest req = leaveRequestRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
            req.setStatus(status);
            leaveRequestRepository.save(req);
        } else if ("TRAVEL".equalsIgnoreCase(entityType)) {
            TravelRequest req = travelRequestRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Travel request not found"));
            req.setStatus(status);
            travelRequestRepository.save(req);
        } else if ("EXPENSE".equalsIgnoreCase(entityType)) {
            ExpenseClaim req = expenseClaimRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Expense request not found"));
            req.setStatus(status);
            expenseClaimRepository.save(req);
        } else if ("REIMBURSEMENT".equalsIgnoreCase(entityType)) {
            Reimbursement req = reimbursementRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reimbursement request not found"));
            req.setStatus(status);
            reimbursementRepository.save(req);
        } else if ("ASSET".equalsIgnoreCase(entityType)) {
            AssetRequest req = assetRequestRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Asset request not found"));
            req.setStatus(status);
            assetRequestRepository.save(req);
        }
    }

    private void executeFinalActionTriggers(String entityType, Integer entityId) {
        if ("LEAVE".equalsIgnoreCase(entityType)) {
            LeaveRequest req = leaveRequestRepository.findById(entityId).orElse(null);
            if (req != null) {
                // Deduct leaves from Balance Table
                LeaveBalance balance = leaveBalanceRepository
                        .findByEmployeeAndLeaveTypeId(req.getEmployee(), req.getLeaveType().getId())
                        .orElse(null);
                if (balance != null) {
                    int daysToDeduct = req.getTotalDays().intValue();
                    balance.setUsed(balance.getUsed() + daysToDeduct);
                    leaveBalanceRepository.save(balance);
                }
            }
        }
    }

    private void sendNotification(String email, String title, String msg) {
        Notification notification = new Notification();
        notification.setRecipientEmail(email);
        notification.setTitle(title);
        notification.setMessage(msg);
        notification.setType("IN_APP");
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }
}
