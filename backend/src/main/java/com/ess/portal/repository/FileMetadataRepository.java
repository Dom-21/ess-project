package com.ess.portal.repository;

import com.ess.portal.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Integer> {
    List<FileMetadata> findByEntityTypeAndEntityId(String entityType, Integer entityId);
}
