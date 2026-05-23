package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "reimbursement_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReimbursementTemplate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "max_limit", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxLimit;

    @Column(nullable = false, length = 50)
    private String frequency; // MONTHLY, QUARTERLY, ANNUALLY, ONE_TIME
}
