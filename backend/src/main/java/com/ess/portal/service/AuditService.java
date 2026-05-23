package com.ess.portal.service;

public interface AuditService {
    void log(String actionType, String entityName, Integer entityId, String actorEmail,
             String ipAddress, String deviceInfo, String oldValue, String newValue);
}
