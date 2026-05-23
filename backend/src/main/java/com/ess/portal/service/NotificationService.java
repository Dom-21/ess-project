package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    List<NotificationDto> getMyNotifications(String email);
    long getUnreadCount(String email);
    void markAsRead(Integer notificationId, String email);
    void markAllAsRead(String email);
    void sendNotification(Integer employeeId, String title, String message, String type, String referenceType, Integer referenceId);
}
