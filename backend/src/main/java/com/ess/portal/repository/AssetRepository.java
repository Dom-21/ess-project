package com.ess.portal.repository;

import com.ess.portal.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Integer> {
    List<Asset> findByAssignedToId(Integer employeeId);
    List<Asset> findByStatus(String status);
}
