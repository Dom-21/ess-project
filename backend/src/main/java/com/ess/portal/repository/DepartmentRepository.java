package com.ess.portal.repository;

import com.ess.portal.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    Optional<Department> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByName(String name);
}
