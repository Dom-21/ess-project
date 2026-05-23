package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AttendanceService {
    AttendanceRecordDto clockIn(String email, Double latitude, Double longitude, Boolean isWfh);
    AttendanceRecordDto clockOut(String email);
    AttendanceRecordDto getTodayAttendance(String email);
    PagedResponse<AttendanceRecordDto> getMyAttendance(String email, LocalDate from, LocalDate to, Pageable pageable);
    PagedResponse<AttendanceRecordDto> getTeamAttendance(String managerEmail, LocalDate date, Pageable pageable);
    AttendanceRecordDto submitRegularization(String email, AttendanceRegularizationRequest request);
}
