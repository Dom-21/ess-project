package com.ess.portal.controller;

import com.ess.portal.dto.*;
import com.ess.portal.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping(value = {"", "/request"})
    public ResponseEntity<LeaveRequestResponse> applyLeave(Principal principal, @Valid @RequestBody LeaveRequestDto request) {
        return ResponseEntity.ok(leaveService.applyLeave(principal.getName(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveRequestResponse> getLeaveById(@PathVariable Integer id) {
        return ResponseEntity.ok(leaveService.getLeaveById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<LeaveRequestResponse>> getMyLeaves(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(leaveService.getMyLeaves(principal.getName(), pageable));
    }

    @GetMapping("/team")
    public ResponseEntity<PagedResponse<LeaveRequestResponse>> getTeamLeaves(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(leaveService.getTeamLeaves(principal.getName(), pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<PagedResponse<LeaveRequestResponse>> getAllLeaves(Pageable pageable) {
        return ResponseEntity.ok(leaveService.getAllLeaves(pageable));
    }

    @PostMapping(value = {"/{id}/cancel", "/cancel/{id}"})
    public ResponseEntity<Void> cancelLeave(@PathVariable Integer id, Principal principal) {
        leaveService.cancelLeave(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/balances")
    public ResponseEntity<List<LeaveBalanceDto>> getMyLeaveBalances(Principal principal) {
        return ResponseEntity.ok(leaveService.getMyLeaveBalances(principal.getName()));
    }
}
