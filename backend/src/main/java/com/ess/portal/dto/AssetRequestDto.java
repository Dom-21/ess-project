package com.ess.portal.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequestDto {

    @NotNull(message = "Asset ID is required")
    private Integer assetId;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500)
    private String purpose;

    @Size(max = 1000)
    private String additionalNotes;
}
