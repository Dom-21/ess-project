package com.ess.portal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "workflow_instances", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"workflow_config_id", "entity_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WorkflowInstance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "workflow_config_id", nullable = false)
    private WorkflowConfig workflowConfig;

    @Column(name = "entity_id", nullable = false)
    private Integer entityId; // Primary key of LeaveRequest, travel etc

    @Column(nullable = false, length = 20)
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "current_step")
    private Integer currentStep = 1;
}
