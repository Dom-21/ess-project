package com.ess.portal.controller;

import com.ess.portal.dto.*;
import com.ess.portal.service.TravelService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/travel")
public class TravelController {

    private final TravelService travelService;

    public TravelController(TravelService travelService) {
        this.travelService = travelService;
    }

    @PostMapping(value = {"", "/request"})
    public ResponseEntity<TravelRequestResponse> submitRequest(Principal principal, @Valid @RequestBody TravelRequestDto request) {
        return ResponseEntity.ok(travelService.submitRequest(principal.getName(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelRequestResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(travelService.getById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<TravelRequestResponse>> getMyRequests(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(travelService.getMyRequests(principal.getName(), pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'FINANCE_MANAGER', 'SYSTEM_ADMIN')")
    public ResponseEntity<PagedResponse<TravelRequestResponse>> getAllRequests(Pageable pageable) {
        return ResponseEntity.ok(travelService.getAllRequests(pageable));
    }

    @PostMapping(value = {"/{id}/cancel", "/cancel/{id}"})
    public ResponseEntity<Void> cancelRequest(@PathVariable Integer id, Principal principal) {
        travelService.cancelRequest(id, principal.getName());
        return ResponseEntity.ok().build();
    }
}
