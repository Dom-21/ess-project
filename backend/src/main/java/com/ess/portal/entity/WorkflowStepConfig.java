package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "workflow_step_config", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"workflow_config_id", "step_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_config_id", nullable = false)
    private WorkflowConfig workflowConfig;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber; // Stage 1, 2...

    @Column(name = "approver_role", nullable = false, length = 100)
    private String approverRole; // REPORTING_MANAGER, HR_ADMIN, FINANCE_MANAGER

    @Column(name = "escalation_buffer_hours")
    private Integer escalationBufferHours = 48;
}
