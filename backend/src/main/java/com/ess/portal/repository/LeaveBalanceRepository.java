package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.LeaveBalance;
import com.ess.portal.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Integer> {
    List<LeaveBalance> findByEmployee(Employee employee);
    Optional<LeaveBalance> findByEmployeeAndLeaveType(Employee employee, LeaveType leaveType);
    Optional<LeaveBalance> findByEmployeeAndLeaveTypeId(Employee employee, Integer leaveTypeId);
}
