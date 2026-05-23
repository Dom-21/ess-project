package com.ess.portal.dto;

import jakarta.validation.constraints.*;
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
public class TravelRequestDto {

    @NotBlank(message = "Purpose is required")
    @Size(max = 500)
    private String purpose;

    @NotBlank(message = "Destination is required")
    @Size(max = 255)
    private String destination;

    @NotNull(message = "Travel date is required")
    private LocalDate travelDate;

    @NotNull(message = "Return date is required")
    private LocalDate returnDate;

    @NotBlank(message = "Mode of transport is required")
    private String modeOfTransport;

    @DecimalMin(value = "0.0")
    private BigDecimal estimatedCost;

    @Size(max = 1000)
    private String additionalNotes;
}
