package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, Integer> {
    List<Reimbursement> findByEmployee(Employee employee);
    List<Reimbursement> findByEmployeeAndStatus(Employee employee, String status);
}
