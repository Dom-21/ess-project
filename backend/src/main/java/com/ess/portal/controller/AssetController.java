package com.ess.portal.controller;

import com.ess.portal.dto.*;
import com.ess.portal.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import com.ess.portal.entity.Asset;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping("/request")
    public ResponseEntity<AssetRequestResponse> requestAsset(Principal principal, @Valid @RequestBody AssetRequestDto request) {
        return ResponseEntity.ok(assetService.requestAsset(principal.getName(), request));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<AssetRequestResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(assetService.getById(id));
    }

    @GetMapping("/requests/me")
    public ResponseEntity<PagedResponse<AssetRequestResponse>> getMyRequests(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(assetService.getMyRequests(principal.getName(), pageable));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('IT_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<PagedResponse<AssetRequestResponse>> getAllRequests(Pageable pageable) {
        return ResponseEntity.ok(assetService.getAllRequests(pageable));
    }

    @PostMapping("/requests/{id}/return")
    public ResponseEntity<Void> returnAsset(@PathVariable Integer id, Principal principal) {
        assetService.returnAsset(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/available")
    public ResponseEntity<List<Asset>> getAvailableAssets() {
        return ResponseEntity.ok(assetService.getAvailableAssets());
    }
}
