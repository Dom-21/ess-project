package com.ess.portal.service;

import com.ess.portal.dto.NotificationDto;
import com.ess.portal.entity.Employee;
import com.ess.portal.entity.Notification;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.EmployeeRepository;
import com.ess.portal.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, EmployeeRepository employeeRepository) {
        this.notificationRepository = notificationRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications(String email) {
        List<Notification> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
        return notifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        // Find all notifications matching criteria and count them in Java
        // or we can count using standard Spring Data naming if supported. Let's just filter the list for simplicity and safety, 
        // or query the database since we already have findByRecipientEmailAndIsReadOrderByCreatedAtDesc in the repository.
        return notificationRepository.findByRecipientEmailAndIsReadOrderByCreatedAtDesc(email, false).size();
    }

    @Override
    public void markAsRead(Integer notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id " + notificationId));
        
        if (notification.getRecipientEmail().equalsIgnoreCase(email)) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    public void markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByRecipientEmailAndIsReadOrderByCreatedAtDesc(email, false);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Override
    public void sendNotification(Integer employeeId, String title, String message, String type, String referenceType, Integer referenceId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + employeeId));
        
        if (employee.getUser() == null || employee.getUser().getEmail() == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipientEmail(employee.getUser().getEmail());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type != null ? type : "IN_APP");
        notification.setIsRead(false);
        notification.setCreatedBy("SYSTEM");
        notification.setUpdatedBy("SYSTEM");

        notificationRepository.save(notification);

        // Simple simulation of email or push notifications if requested
        if ("EMAIL".equalsIgnoreCase(type) || "BOTH".equalsIgnoreCase(type)) {
            System.out.println("SIMULATING EMAIL SENT TO: " + employee.getUser().getEmail());
            System.out.println("SUBJECT: " + title);
            System.out.println("BODY: " + message);
        }
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
