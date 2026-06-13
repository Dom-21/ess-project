package com.ess.portal.kafka;

import com.ess.portal.config.KafkaConfig;
import com.ess.portal.dto.NotificationEvent;
import com.ess.portal.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class NotificationConsumer {

    private final NotificationService notificationService;

    public NotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Listens to the Kafka topic and processes incoming events.
     * Since this runs in a separate thread pool managed by Spring Kafka,
     * the core request execution is completely decoupled.
     *
     * @param event The notification event payload consumed
     */
    @KafkaListener(topics = KafkaConfig.NOTIFICATION_TOPIC, groupId = "ess-notification-group")
    public void consumeNotificationEvent(NotificationEvent event) {
        log.info("Received notification event from Kafka topic [{}]: {}", KafkaConfig.NOTIFICATION_TOPIC, event);
        try {
            // Forward event processing to NotificationService for asynchronous save and delivery
            notificationService.processNotificationEvent(event);
            log.info("Finished processing Kafka notification event.");
        } catch (Exception e) {
            log.error("Error processing consumed notification event: {}, error: {}", event, e.getMessage(), e);
        }
    }
}
