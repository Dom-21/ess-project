package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "salary_structures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStructure extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basic;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hra;

    @Column(name = "special_allowance", nullable = false, precision = 10, scale = 2)
    private BigDecimal specialAllowance;

    @Column(precision = 10, scale = 2)
    private BigDecimal lta = BigDecimal.ZERO;

    @Column(name = "provident_fund", nullable = false, precision = 10, scale = 2)
    private BigDecimal providentFund;

    @Column(name = "professional_tax", precision = 10, scale = 2)
    private BigDecimal professionalTax = new BigDecimal("200.00");

    @Column(name = "income_tax_projection", precision = 10, scale = 2)
    private BigDecimal incomeTaxProjection = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ctc;
}
