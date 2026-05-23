package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.WorkflowTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, Integer> {
    List<WorkflowTask> findByAssignedApproverAndStatus(Employee assignedApprover, String status);
    List<WorkflowTask> findByAssignedRoleAndStatus(String assignedRole, String status);
}
