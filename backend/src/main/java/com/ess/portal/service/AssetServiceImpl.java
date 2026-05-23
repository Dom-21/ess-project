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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final AssetRequestRepository assetRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkflowEngineService workflowEngineService;
    private final NotificationService notificationService;
    private final AssetRepository assetRepository;

    @Override
    @Transactional
    public AssetRequestResponse requestAsset(String email, AssetRequestDto request) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        AssetRequest assetRequest = new AssetRequest();
        assetRequest.setEmployee(emp);
        assetRequest.setAsset(asset);
        assetRequest.setCategory(asset.getCategory());
        assetRequest.setPurpose(request.getPurpose());
        assetRequest.setAdditionalNotes(request.getAdditionalNotes());
        assetRequest.setStatus("PENDING");
        assetRequest = assetRequestRepository.save(assetRequest);

        try {
            workflowEngineService.initiate("ASSET", assetRequest.getId(), emp);
        } catch (Exception e) { /* Non-blocking */ }

        if (emp.getReportingManager() != null) {
            notificationService.sendNotification(emp.getReportingManager().getId(),
                    "New Asset Request",
                    emp.getFirstName() + " " + emp.getLastName() + " has submitted an asset request.",
                    "ASSET", "ASSET_REQUEST", assetRequest.getId());
        }

        return toResponse(assetRequest);
    }

    @Override
    public AssetRequestResponse getById(Integer id) {
        return toResponse(assetRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset request not found: " + id)));
    }

    @Override
    public PagedResponse<AssetRequestResponse> getMyRequests(String email, Pageable pageable) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return toPagedResponse(assetRequestRepository.findByEmployee(emp, pageable));
    }

    @Override
    public PagedResponse<AssetRequestResponse> getAllRequests(Pageable pageable) {
        return toPagedResponse(assetRequestRepository.findAll(pageable));
    }

    @Override
    @Transactional
    public void returnAsset(Integer requestId, String email) {
        AssetRequest req = assetRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset request not found: " + requestId));
        if (!req.getEmployee().getUser().getEmail().equals(email)) {
            throw new BadRequestException("You can only return your own assets");
        }
        if (!"APPROVED".equals(req.getStatus())) {
            throw new BadRequestException("Only approved assets can be returned");
        }
        req.setStatus("RETURNED");
        req.setReturnedDate(LocalDate.now());
        assetRequestRepository.save(req);
    }

    private AssetRequestResponse toResponse(AssetRequest r) {
        return AssetRequestResponse.builder()
                .id(r.getId())
                .employeeId(r.getEmployee().getEmployeeId())
                .employeeName(r.getEmployee().getFirstName() + " " + r.getEmployee().getLastName())
                .purpose(r.getPurpose())
                .additionalNotes(r.getAdditionalNotes())
                .status(r.getStatus())
                .currentApprover(workflowEngineService.getCurrentApprover("ASSET", r.getId()))
                .approverRemarks(workflowEngineService.getLatestRemarks("ASSET", r.getId()))
                .assignedDate(r.getAssignedDate())
                .returnedDate(r.getReturnedDate())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private PagedResponse<AssetRequestResponse> toPagedResponse(Page<AssetRequest> page) {
        return PagedResponse.<AssetRequestResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }

    @Override
    public List<Asset> getAvailableAssets() {
        return assetRepository.findByStatus("AVAILABLE");
    }
}
