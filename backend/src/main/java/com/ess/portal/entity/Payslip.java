package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "payslips", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "month", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payslip extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

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

    @Column(name = "income_tax_deducted", precision = 10, scale = 2)
    private BigDecimal incomeTaxDeducted = BigDecimal.ZERO;

    @Column(name = "gross_earnings", nullable = false, precision = 10, scale = 2)
    private BigDecimal grossEarnings;

    @Column(name = "total_deductions", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", nullable = false, precision = 10, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus; // PENDING, PROCESSED, PAID

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "file_metadata_id")
    private FileMetadata fileMetadata;
}
