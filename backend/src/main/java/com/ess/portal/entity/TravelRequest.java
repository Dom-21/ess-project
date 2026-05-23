package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "travel_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TravelRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(nullable = false, length = 100)
    private String origin;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "estimated_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "advance_amount", precision = 10, scale = 2)
    private BigDecimal advanceAmount = BigDecimal.ZERO;

    @Column(name = "mode_of_transport", length = 50)
    private String modeOfTransport;

    @Column(name = "additional_notes", length = 1000)
    private String additionalNotes;

    @Column(name = "actual_cost", precision = 10, scale = 2)
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
}
