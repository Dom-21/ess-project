package com.ess.portal.service;

import com.ess.portal.dto.PayslipDto;
import org.springframework.data.domain.Pageable;
import com.ess.portal.dto.PagedResponse;

public interface PayrollService {
    PagedResponse<PayslipDto> getMyPayslips(String email, Pageable pageable);
    PayslipDto getPayslipById(Integer id, String email);
    PayslipDto getPayslipByMonthYear(String email, int month, int year);
}
