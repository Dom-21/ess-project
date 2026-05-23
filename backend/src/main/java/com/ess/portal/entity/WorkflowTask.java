package com.ess.portal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WorkflowTask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false)
    private WorkflowInstance workflowInstance;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_approver_id")
    private Employee assignedApprover;

    @Column(name = "assigned_role", length = 50)
    private String assignedRole;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, COMPLETED, DELEGATED, ESCALATED, BYPASSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegated_to_id")
    private Employee delegatedTo;

    @Column(name = "escalation_deadline")
    private LocalDateTime escalationDeadline;
}
