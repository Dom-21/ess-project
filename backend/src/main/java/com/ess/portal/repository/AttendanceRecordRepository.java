package com.ess.portal.repository;

import com.ess.portal.entity.AttendanceRecord;
import com.ess.portal.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Integer> {
    Optional<AttendanceRecord> findByEmployeeAndDate(Employee employee, LocalDate date);
    Page<AttendanceRecord> findByEmployeeAndDateBetween(Employee employee, LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<AttendanceRecord> findByEmployeeInAndDate(List<Employee> employees, LocalDate date, Pageable pageable);
    List<AttendanceRecord> findByDate(LocalDate date);
}
