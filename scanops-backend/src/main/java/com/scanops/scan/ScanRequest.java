package com.scanops.scan;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ScanRequest {

    /** 웹사이트 스캔: https://example.com  /  GitHub 레포 스캔: https://github.com/user/repo */
    @NotBlank(message = "URL을 입력해 주세요")
    @Pattern(
        regexp = "^https?://[^\\s/$.?#].[^\\s]*$",
        message = "URL은 http:// 또는 https://로 시작하는 올바른 형식이어야 합니다"
    )
    private String targetUrl;

    @Email
    @NotBlank
    private String ownerEmail;

    /** 생략 시 targetUrl로 자동 판별 (github.com 포함 → GITHUB_REPO) */
    private ScanMode scanMode;
}
