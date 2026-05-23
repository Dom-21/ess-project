package com.ess.portal.repository;

import com.ess.portal.entity.WorkflowActionLog;
import com.ess.portal.entity.WorkflowInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowActionLogRepository extends JpaRepository<WorkflowActionLog, Integer> {
    List<WorkflowActionLog> findByWorkflowInstanceOrderByStepNumberAsc(WorkflowInstance workflowInstance);
}
