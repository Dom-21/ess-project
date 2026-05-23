package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "workflow_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "entity_type", nullable = false, unique = true, length = 50)
    private String entityType; // LEAVE, TRAVEL, EXPENSE, REIMBURSEMENT, ASSET

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
