package com.ess.portal.service;

import com.ess.portal.dto.PagedResponse;
import com.ess.portal.dto.PayslipDto;
import com.ess.portal.entity.Payslip;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.PayslipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PayrollServiceImpl implements PayrollService {

    private final PayslipRepository payslipRepository;

    public PayrollServiceImpl(PayslipRepository payslipRepository) {
        this.payslipRepository = payslipRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PayslipDto> getMyPayslips(String email, Pageable pageable) {
        Page<Payslip> payslipPage = payslipRepository.findByEmployeeUserEmail(email, pageable);
        
        List<PayslipDto> content = payslipPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PagedResponse.<PayslipDto>builder()
                .content(content)
                .page(payslipPage.getNumber())
                .size(payslipPage.getSize())
                .totalElements(payslipPage.getTotalElements())
                .totalPages(payslipPage.getTotalPages())
                .first(payslipPage.isFirst())
                .last(payslipPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PayslipDto getPayslipById(Integer id, String email) {
        Payslip payslip = payslipRepository.findByIdAndEmployeeUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id " + id + " for user " + email));
        return mapToDto(payslip);
    }

    @Override
    @Transactional(readOnly = true)
    public PayslipDto getPayslipByMonthYear(String email, int month, int year) {
        Payslip payslip = payslipRepository.findByEmployeeUserEmailAndMonthAndYear(email, month, year)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found for " + month + "/" + year + " for user " + email));
        return mapToDto(payslip);
    }

    private PayslipDto mapToDto(Payslip payslip) {
        if (payslip == null) return null;

        String employeeName = "";
        String deptName = "";
        String desigName = "";
        String empIdStr = "";

        if (payslip.getEmployee() != null) {
            employeeName = payslip.getEmployee().getFirstName() + " " + payslip.getEmployee().getLastName();
            empIdStr = payslip.getEmployee().getEmployeeId();
            if (payslip.getEmployee().getDepartment() != null) {
                deptName = payslip.getEmployee().getDepartment().getName();
            }
            if (payslip.getEmployee().getDesignation() != null) {
                desigName = payslip.getEmployee().getDesignation().getTitle();
            }
        }

        return PayslipDto.builder()
                .id(payslip.getId())
                .employeeId(empIdStr)
                .employeeName(employeeName)
                .departmentName(deptName)
                .designationName(desigName)
                .month(payslip.getMonth())
                .year(payslip.getYear())
                .basicSalary(payslip.getBasic())
                .hra(payslip.getHra())
                .specialAllowance(payslip.getSpecialAllowance())
                .transportAllowance(payslip.getLta() != null ? payslip.getLta() : BigDecimal.ZERO)
                .medicalAllowance(BigDecimal.ZERO)
                .otherAllowances(BigDecimal.ZERO)
                .grossSalary(payslip.getGrossEarnings())
                .pfEmployee(payslip.getProvidentFund())
                .pfEmployer(BigDecimal.ZERO)
                .esiEmployee(BigDecimal.ZERO)
                .esiEmployer(BigDecimal.ZERO)
                .professionalTax(payslip.getProfessionalTax() != null ? payslip.getProfessionalTax() : new BigDecimal("200.00"))
                .tds(payslip.getIncomeTaxDeducted() != null ? payslip.getIncomeTaxDeducted() : BigDecimal.ZERO)
                .otherDeductions(BigDecimal.ZERO)
                .totalDeductions(payslip.getTotalDeductions())
                .netSalary(payslip.getNetSalary())
                .paidDate(payslip.getUpdatedAt() != null ? payslip.getUpdatedAt().toLocalDate() : null)
                .status(payslip.getPaymentStatus())
                .createdAt(payslip.getCreatedAt())
                .build();
    }
}
