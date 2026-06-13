package com.ess.portal.service;

import com.ess.portal.dto.NotificationDto;
import com.ess.portal.dto.NotificationEvent;
import com.ess.portal.entity.Employee;
import com.ess.portal.entity.Notification;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.kafka.NotificationProducer;
import com.ess.portal.repository.EmployeeRepository;
import com.ess.portal.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final Optional<NotificationProducer> notificationProducer;

    public NotificationServiceImpl(NotificationRepository notificationRepository, 
                                   EmployeeRepository employeeRepository,
                                   Optional<NotificationProducer> notificationProducer) {
        this.notificationRepository = notificationRepository;
        this.employeeRepository = employeeRepository;
        this.notificationProducer = notificationProducer;
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
        NotificationEvent event = NotificationEvent.builder()
                .employeeId(employeeId)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        if (notificationProducer.isPresent()) {
            notificationProducer.get().sendNotificationEvent(event);
        } else {
            processNotificationEvent(event);
        }
    }

    @Override
    public void processNotificationEvent(NotificationEvent event) {
        String email = event.getRecipientEmail();
        
        if (email == null && event.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(event.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + event.getEmployeeId()));
            if (employee.getUser() != null && employee.getUser().getEmail() != null) {
                email = employee.getUser().getEmail();
            }
        }

        if (email == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipientEmail(email);
        notification.setTitle(event.getTitle());
        notification.setMessage(event.getMessage());
        notification.setType(event.getType() != null ? event.getType() : "IN_APP");
        notification.setIsRead(false);
        notification.setCreatedBy("SYSTEM");
        notification.setUpdatedBy("SYSTEM");

        notificationRepository.save(notification);

        // Simple simulation of email or push notifications if requested
        if ("EMAIL".equalsIgnoreCase(event.getType()) || "BOTH".equalsIgnoreCase(event.getType())) {
            System.out.println("SIMULATING EMAIL SENT TO: " + email);
            System.out.println("SUBJECT: " + event.getTitle());
            System.out.println("BODY: " + event.getMessage());
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
