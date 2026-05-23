package com.ess.portal.service;

import com.ess.portal.entity.AuditLog;
import com.ess.portal.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditServiceImpl implements AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void log(String actionType, String entityName, Integer entityId, String actorEmail,
                    String ipAddress, String deviceInfo, String oldValue, String newValue) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActionType(actionType);
        auditLog.setEntityName(entityName);
        auditLog.setEntityId(entityId);
        auditLog.setActorEmail(actorEmail != null ? actorEmail : "ANONYMOUS");
        auditLog.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
        auditLog.setDeviceInfo(deviceInfo != null ? deviceInfo : "UNKNOWN DEVICE");
        auditLog.setOldValue(oldValue);
        auditLog.setNewValue(newValue);
        auditLogRepository.save(auditLog);
    }
}
