package com.ess.portal.controller;

import com.ess.portal.dto.PagedResponse;
import com.ess.portal.dto.PayslipDto;
import com.ess.portal.service.PayrollService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping("/payslips")
    public ResponseEntity<PagedResponse<PayslipDto>> getMyPayslips(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(payrollService.getMyPayslips(principal.getName(), pageable));
    }

    @GetMapping("/payslips/{id}")
    public ResponseEntity<PayslipDto> getPayslipById(@PathVariable Integer id, Principal principal) {
        return ResponseEntity.ok(payrollService.getPayslipById(id, principal.getName()));
    }

    @GetMapping("/payslips/date")
    public ResponseEntity<PayslipDto> getPayslipByMonthYear(
            Principal principal,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(payrollService.getPayslipByMonthYear(principal.getName(), month, year));
    }
}
