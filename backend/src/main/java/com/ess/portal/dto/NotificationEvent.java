package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Event representation of a Notification pushed to Kafka and processed asynchronously.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer employeeId;
    private String recipientEmail;
    private String title;
    private String message;
    private String type; // e.g., EMAIL, IN_APP, BOTH
    private String referenceType; // e.g., LEAVE, EXPENSE
    private Integer referenceId;
}
