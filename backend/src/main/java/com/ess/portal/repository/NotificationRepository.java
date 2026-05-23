package com.ess.portal.repository;

import com.ess.portal.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByRecipientEmailAndIsReadOrderByCreatedAtDesc(String recipientEmail, Boolean isRead);
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
}
