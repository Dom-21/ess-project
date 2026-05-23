package com.ess.portal.repository;

import com.ess.portal.entity.WorkflowConfig;
import com.ess.portal.entity.WorkflowStepConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepConfigRepository extends JpaRepository<WorkflowStepConfig, Integer> {
    List<WorkflowStepConfig> findByWorkflowConfigOrderByStepNumberAsc(WorkflowConfig workflowConfig);
    Optional<WorkflowStepConfig> findByWorkflowConfigAndStepNumber(WorkflowConfig workflowConfig, Integer stepNumber);
}
