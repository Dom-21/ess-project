package com.ess.portal.repository;

import com.ess.portal.entity.AssetRequest;
import com.ess.portal.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRequestRepository extends JpaRepository<AssetRequest, Integer> {
    Page<AssetRequest> findByEmployee(Employee employee, Pageable pageable);
    List<AssetRequest> findByEmployeeAndStatus(Employee employee, String status);
}

