package com.ess.portal.repository;

import com.ess.portal.entity.Payslip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Integer> {
    Page<Payslip> findByEmployeeUserEmail(String email, Pageable pageable);
    Optional<Payslip> findByIdAndEmployeeUserEmail(Integer id, String email);
    Optional<Payslip> findByEmployeeUserEmailAndMonthAndYear(String email, int month, int year);
}
