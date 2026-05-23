package com.ess.portal.service;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.WorkflowTask;

import java.util.List;

public interface WorkflowEngineService {
    void initiate(String entityType, Integer entityId, Employee maker);
    void processTask(Integer taskId, String action, String remarks, Employee actor);
    void cancel(String entityType, Integer entityId, Employee maker);
    List<WorkflowTask> getPendingInbox(Employee approver);
    String getCurrentApprover(String entityType, Integer entityId);
    String getLatestRemarks(String entityType, Integer entityId);
}
