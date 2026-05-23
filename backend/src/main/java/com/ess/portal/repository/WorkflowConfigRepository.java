package com.ess.portal.repository;

import com.ess.portal.entity.WorkflowConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkflowConfigRepository extends JpaRepository<WorkflowConfig, Integer> {
    Optional<WorkflowConfig> findByEntityType(String entityType);
}
