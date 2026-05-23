package com.ess.portal.service;

import com.ess.portal.dto.*;
import org.springframework.data.domain.Pageable;

import com.ess.portal.entity.Asset;
import java.util.List;

public interface AssetService {
    AssetRequestResponse requestAsset(String email, AssetRequestDto request);
    AssetRequestResponse getById(Integer id);
    PagedResponse<AssetRequestResponse> getMyRequests(String email, Pageable pageable);
    PagedResponse<AssetRequestResponse> getAllRequests(Pageable pageable);
    void returnAsset(Integer requestId, String email);
    List<Asset> getAvailableAssets();
}
