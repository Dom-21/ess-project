package com.ess.portal.repository;

import com.ess.portal.entity.Employee;
import com.ess.portal.entity.TravelRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelRequestRepository extends JpaRepository<TravelRequest, Integer> {
    Page<TravelRequest> findByEmployee(Employee employee, Pageable pageable);
    List<TravelRequest> findByEmployeeAndStatus(Employee employee, String status);
}

