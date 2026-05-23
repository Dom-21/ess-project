package com.ess.portal.controller;

import com.ess.portal.dto.*;
import com.ess.portal.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<AttendanceRecordDto> clockIn(
            Principal principal,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "false") Boolean isWfh) {
        return ResponseEntity.ok(attendanceService.clockIn(principal.getName(), latitude, longitude, isWfh));
    }

    @PostMapping("/clock-out")
    public ResponseEntity<AttendanceRecordDto> clockOut(Principal principal) {
        return ResponseEntity.ok(attendanceService.clockOut(principal.getName()));
    }

    @GetMapping("/today")
    public ResponseEntity<AttendanceRecordDto> getTodayAttendance(Principal principal) {
        return ResponseEntity.ok(attendanceService.getTodayAttendance(principal.getName()));
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<AttendanceRecordDto>> getMyAttendance(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Pageable pageable) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(principal.getName(), from, to, pageable));
    }

    @GetMapping("/team")
    public ResponseEntity<PagedResponse<AttendanceRecordDto>> getTeamAttendance(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Pageable pageable) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(attendanceService.getTeamAttendance(principal.getName(), queryDate, pageable));
    }

    @PostMapping("/regularize")
    public ResponseEntity<AttendanceRecordDto> submitRegularization(
            Principal principal,
            @Valid @RequestBody AttendanceRegularizationRequest request) {
        return ResponseEntity.ok(attendanceService.submitRegularization(principal.getName(), request));
    }
}
