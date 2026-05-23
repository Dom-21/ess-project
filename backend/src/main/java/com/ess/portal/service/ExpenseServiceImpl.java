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

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseClaimRepository expenseClaimRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkflowEngineService workflowEngineService;
    private final NotificationService notificationService;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final FileMetadataRepository fileMetadataRepository;

    @Override
    @Transactional
    public ExpenseClaimResponse submitClaim(String email, ExpenseClaimDto request) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        ExpenseClaim claim = new ExpenseClaim();
        claim.setEmployee(emp);
        claim.setTitle(request.getTitle());
        claim.setClaimDate(request.getClaimDate());
        claim.setRemarks(request.getDescription());
        claim.setStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;
        for (ExpenseItemDto itemDto : request.getItems()) {
            ExpenseItem item = new ExpenseItem();
            item.setExpenseClaim(claim);
            item.setDescription(itemDto.getDescription());
            item.setAmount(itemDto.getAmount());
            item.setItemDate(itemDto.getExpenseDate());
            
            if (itemDto.getCategoryId() != null) {
                ExpenseCategory cat = expenseCategoryRepository.findById(itemDto.getCategoryId())
                        .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + itemDto.getCategoryId()));
                item.setExpenseCategory(cat);
            }

            if (itemDto.getReceiptUrl() != null && !itemDto.getReceiptUrl().isEmpty()) {
                FileMetadata meta = new FileMetadata();
                meta.setFileName("receipt_" + System.currentTimeMillis());
                meta.setFilePath(itemDto.getReceiptUrl());
                meta.setFileType("image/png");
                meta.setEntityType("RECEIPT");
                meta = fileMetadataRepository.save(meta);
                item.setFileMetadata(meta);
            }

            claim.getItems().add(item);
            total = total.add(itemDto.getAmount());
        }
        claim.setTotalAmount(total);
        claim = expenseClaimRepository.save(claim);

        try {
            workflowEngineService.initiate("EXPENSE", claim.getId(), emp);
        } catch (Exception e) { /* Non-blocking */ }

        if (emp.getReportingManager() != null) {
            notificationService.sendNotification(emp.getReportingManager().getId(),
                    "New Expense Claim",
                    emp.getFirstName() + " " + emp.getLastName() + " submitted an expense claim of ₹" + total,
                    "EXPENSE", "EXPENSE_CLAIM", claim.getId());
        }

        return toResponse(claim);
    }

    @Override
    public ExpenseClaimResponse getById(Integer id) {
        return toResponse(expenseClaimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense claim not found: " + id)));
    }

    @Override
    public PagedResponse<ExpenseClaimResponse> getMyClaims(String email, Pageable pageable) {
        Employee emp = employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return toPagedResponse(expenseClaimRepository.findByEmployee(emp, pageable));
    }

    @Override
    public PagedResponse<ExpenseClaimResponse> getAllClaims(Pageable pageable) {
        return toPagedResponse(expenseClaimRepository.findAll(pageable));
    }

    @Override
    @Transactional
    public void cancelClaim(Integer id, String email) {
        ExpenseClaim claim = expenseClaimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense claim not found: " + id));
        if (!claim.getEmployee().getUser().getEmail().equals(email)) {
            throw new BadRequestException("You can only cancel your own claims");
        }
        if (!"PENDING".equals(claim.getStatus())) {
            throw new BadRequestException("Only PENDING claims can be cancelled");
        }
        claim.setStatus("CANCELLED");
        expenseClaimRepository.save(claim);
    }

    private ExpenseClaimResponse toResponse(ExpenseClaim c) {
        List<ExpenseItemResponse> items = c.getItems() != null
                ? c.getItems().stream().map(i -> ExpenseItemResponse.builder()
                        .id(i.getId())
                        .description(i.getDescription())
                        .amount(i.getAmount())
                        .expenseDate(i.getItemDate())
                        .receiptUrl(i.getFileMetadata() != null ? i.getFileMetadata().getFilePath() : null)
                        .categoryName(i.getExpenseCategory() != null ? i.getExpenseCategory().getName() : null)
                        .build()).collect(Collectors.toList())
                : List.of();

        return ExpenseClaimResponse.builder()
                .id(c.getId())
                .employeeId(c.getEmployee().getEmployeeId())
                .employeeName(c.getEmployee().getFirstName() + " " + c.getEmployee().getLastName())
                .title(c.getTitle())
                .claimDate(c.getClaimDate())
                .description(c.getRemarks())
                .totalAmount(c.getTotalAmount())
                .status(c.getStatus())
                .currentApprover(workflowEngineService.getCurrentApprover("EXPENSE", c.getId()))
                .approverRemarks(workflowEngineService.getLatestRemarks("EXPENSE", c.getId()))
                .items(items)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private PagedResponse<ExpenseClaimResponse> toPagedResponse(Page<ExpenseClaim> page) {
        return PagedResponse.<ExpenseClaimResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }
}
