package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {
    Page<LeaveRequest> findByEmployee(Employee employee, Pageable pageable);
    List<LeaveRequest> findByEmployeeAndStatus(Employee employee, String status);
    Page<LeaveRequest> findByEmployeeIn(List<Employee> employees, Pageable pageable);
}

