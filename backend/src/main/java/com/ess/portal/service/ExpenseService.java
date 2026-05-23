package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

public interface ExpenseService {
    ExpenseClaimResponse submitClaim(String email, ExpenseClaimDto request);
    ExpenseClaimResponse getById(Integer id);
    PagedResponse<ExpenseClaimResponse> getMyClaims(String email, Pageable pageable);
    PagedResponse<ExpenseClaimResponse> getAllClaims(Pageable pageable);
    void cancelClaim(Integer id, String email);
}
