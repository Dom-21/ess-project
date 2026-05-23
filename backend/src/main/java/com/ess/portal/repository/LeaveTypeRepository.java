package com.ess.portal.repository;

import com.ess.portal.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Integer> {
    Optional<LeaveType> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByName(String name);
}
