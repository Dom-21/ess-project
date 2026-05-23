package com.ess.portal.controller;

import com.ess.portal.dto.*;
import com.ess.portal.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping(value = {"", "/request"})
    public ResponseEntity<ExpenseClaimResponse> submitClaim(Principal principal, @Valid @RequestBody ExpenseClaimDto request) {
        return ResponseEntity.ok(expenseService.submitClaim(principal.getName(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseClaimResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(expenseService.getById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<ExpenseClaimResponse>> getMyClaims(Principal principal, Pageable pageable) {
        return ResponseEntity.ok(expenseService.getMyClaims(principal.getName(), pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'SYSTEM_ADMIN')")
    public ResponseEntity<PagedResponse<ExpenseClaimResponse>> getAllClaims(Pageable pageable) {
        return ResponseEntity.ok(expenseService.getAllClaims(pageable));
    }

    @PostMapping(value = {"/{id}/cancel", "/cancel/{id}"})
    public ResponseEntity<Void> cancelClaim(@PathVariable Integer id, Principal principal) {
        expenseService.cancelClaim(id, principal.getName());
        return ResponseEntity.ok().build();
    }
}
