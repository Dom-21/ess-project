package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LeaveService {
    LeaveRequestResponse applyLeave(String email, LeaveRequestDto request);
    LeaveRequestResponse getLeaveById(Integer id);
    PagedResponse<LeaveRequestResponse> getMyLeaves(String email, Pageable pageable);
    PagedResponse<LeaveRequestResponse> getTeamLeaves(String managerEmail, Pageable pageable);
    PagedResponse<LeaveRequestResponse> getAllLeaves(Pageable pageable);
    void cancelLeave(Integer id, String email);
    List<LeaveBalanceDto> getMyLeaveBalances(String email);
}
