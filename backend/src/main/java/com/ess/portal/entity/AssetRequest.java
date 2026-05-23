package com.ess.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "asset_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, APPROVED, ALLOCATED, REJECTED, RETURN_REQUESTED, RETURNED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @Transient
    private String additionalNotes;

    @Transient
    private LocalDate returnedDate;

    public String getPurpose() {
        return this.reason;
    }

    public void setPurpose(String purpose) {
        this.reason = purpose;
    }

    public LocalDate getAssignedDate() {
        return this.asset != null ? this.asset.getAssignmentDate() : null;
    }

    public void setAssignedDate(LocalDate assignedDate) {
        if (this.asset != null) {
            this.asset.setAssignmentDate(assignedDate);
        }
    }
}

