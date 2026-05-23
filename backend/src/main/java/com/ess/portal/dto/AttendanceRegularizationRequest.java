package com.ess.portal.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRegularizationRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Check-in time is required")
    private LocalTime checkIn;

    @NotNull(message = "Check-out time is required")
    private LocalTime checkOut;

    @NotBlank(message = "Reason is required")
    @Size(max = 500)
    private String reason;
}
