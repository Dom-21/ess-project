package com.ess.portal.kafka;

import com.ess.portal.config.KafkaConfig;
import com.ess.portal.dto.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class NotificationProducer {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    public NotificationProducer(KafkaTemplate<String, NotificationEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publishes a NotificationEvent to Kafka topic asynchronously.
     * Keeps core transactional operations safe from broker outages.
     *
     * @param event The notification payload
     */
    public void sendNotificationEvent(NotificationEvent event) {
        log.info("Preparing to publish notification event to Kafka: {}", event);
        try {
            kafkaTemplate.send(KafkaConfig.NOTIFICATION_TOPIC, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish notification event to Kafka. Event: {}, Error: {}", event, ex.getMessage(), ex);
                    } else {
                        log.info("Successfully published notification event to Kafka topic [{}] at offset {}",
                                KafkaConfig.NOTIFICATION_TOPIC, result.getRecordMetadata().offset());
                    }
                });
        } catch (Exception e) {
            log.error("Sync block failure publishing notification event to Kafka. Topic connection issue: {}", e.getMessage(), e);
        }
    }
}
