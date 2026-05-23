package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    Optional<Employee> findByEmployeeId(String employeeId);
    Optional<Employee> findByUser(User user);
    Optional<Employee> findByUserEmail(String email);
    List<Employee> findByReportingManager(Employee reportingManager);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Employee> searchByName(@Param("query") String query);
}

