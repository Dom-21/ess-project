package com.ess.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseItemResponse {
    private Integer id;
    private String categoryName;
    private String description;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String receiptUrl;
}
