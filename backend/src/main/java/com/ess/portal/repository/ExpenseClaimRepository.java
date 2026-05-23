package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.ExpenseClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Integer> {
    Page<ExpenseClaim> findByEmployee(Employee employee, Pageable pageable);
    List<ExpenseClaim> findByEmployeeAndStatus(Employee employee, String status);
}

