package com.ess.portal.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimDto {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "Claim date is required")
    private LocalDate claimDate;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Expense items are required")
    @Size(min = 1, message = "At least one expense item is required")
    private List<ExpenseItemDto> items;
}
