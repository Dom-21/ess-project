package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

public interface TravelService {
    TravelRequestResponse submitRequest(String email, TravelRequestDto request);
    TravelRequestResponse getById(Integer id);
    PagedResponse<TravelRequestResponse> getMyRequests(String email, Pageable pageable);
    PagedResponse<TravelRequestResponse> getAllRequests(Pageable pageable);
    void cancelRequest(Integer id, String email);
}
