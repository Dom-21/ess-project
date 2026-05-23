package com.ess.portal.service;

import com.ess.portal.dto.*;
import com.ess.portal.entity.*;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public AttendanceRecordDto clockIn(String email, Double latitude, Double longitude, Boolean isWfh) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LocalDate today = LocalDate.now();
        if (attendanceRecordRepository.findByEmployeeAndDate(emp, today).isPresent()) {
            throw new BadRequestException("You have already clocked in today");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(emp);
        record.setDate(today);
        record.setCheckIn(LocalDateTime.now());
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setIsWfh(isWfh != null ? isWfh : false);
        record.setStatus("PRESENT");

        // Check if late (default shift: 9:00 AM)
        LocalTime expectedIn = LocalTime.of(9, 0);
        record.setIsLate(LocalTime.now().isAfter(expectedIn.plusMinutes(15)));

        return toDto(attendanceRecordRepository.save(record));
    }

    @Override
    @Transactional
    public AttendanceRecordDto clockOut(String email) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        AttendanceRecord record = attendanceRecordRepository.findByEmployeeAndDate(emp, LocalDate.now())
                .orElseThrow(() -> new BadRequestException("No clock-in found for today. Please clock in first."));

        if (record.getCheckOut() != null) {
            throw new BadRequestException("You have already clocked out today");
        }

        record.setCheckOut(LocalDateTime.now());
        return toDto(attendanceRecordRepository.save(record));
    }

    @Override
    public AttendanceRecordDto getTodayAttendance(String email) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return attendanceRecordRepository.findByEmployeeAndDate(emp, LocalDate.now())
                .map(this::toDto).orElse(null);
    }

    @Override
    public PagedResponse<AttendanceRecordDto> getMyAttendance(String email, LocalDate from, LocalDate to,
            Pageable pageable) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Page<AttendanceRecord> page = attendanceRecordRepository.findByEmployeeAndDateBetween(emp, from, to, pageable);
        return toPagedResponse(page);
    }

    @Override
    public PagedResponse<AttendanceRecordDto> getTeamAttendance(String managerEmail, LocalDate date,
            Pageable pageable) {
        Employee manager = employeeRepository.findByUserEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        List<Employee> team = employeeRepository.findByReportingManager(manager);
        Page<AttendanceRecord> page = attendanceRecordRepository.findByEmployeeInAndDate(team, date, pageable);
        return toPagedResponse(page);
    }

    @Override
    @Transactional
    public AttendanceRecordDto submitRegularization(String email, AttendanceRegularizationRequest request) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        AttendanceRecord record = attendanceRecordRepository.findByEmployeeAndDate(emp, request.getDate())
                .orElseGet(() -> {
                    AttendanceRecord newRecord = new AttendanceRecord();
                    newRecord.setEmployee(emp);
                    newRecord.setDate(request.getDate());
                    newRecord.setStatus("PRESENT");
                    newRecord.setIsLate(false);
                    newRecord.setIsWfh(false);
                    return newRecord;
                });

        record.setCheckIn(LocalDateTime.of(request.getDate(), request.getCheckIn()));
        record.setCheckOut(LocalDateTime.of(request.getDate(), request.getCheckOut()));
        return toDto(attendanceRecordRepository.save(record));
    }

    private AttendanceRecordDto toDto(AttendanceRecord r) {
        double hoursWorked = 0;
        if (r.getCheckIn() != null && r.getCheckOut() != null) {
            hoursWorked = ChronoUnit.MINUTES.between(r.getCheckIn(), r.getCheckOut()) / 60.0;
        }
        return AttendanceRecordDto.builder()
                .id(r.getId())
                .employeeId(r.getEmployee().getEmployeeId())
                .employeeName(r.getEmployee().getFirstName() + " " + r.getEmployee().getLastName())
                .date(r.getDate())
                .checkIn(r.getCheckIn())
                .checkOut(r.getCheckOut())
                .shiftName(r.getShift() != null ? r.getShift().getName() : "Default")
                .isLate(r.getIsLate())
                .isWfh(r.getIsWfh())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .status(r.getStatus())
                .hoursWorked(Math.round(hoursWorked * 100.0) / 100.0)
                .build();
    }

    private PagedResponse<AttendanceRecordDto> toPagedResponse(Page<AttendanceRecord> page) {
        return PagedResponse.<AttendanceRecordDto>builder()
                .content(page.getContent().stream().map(this::toDto).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }
}
