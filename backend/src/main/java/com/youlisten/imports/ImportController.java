package com.youlisten.imports;

import com.youlisten.exception.BadRequestException;
import com.youlisten.imports.dto.ImportDtos.ConfirmRequest;
import com.youlisten.imports.dto.ImportDtos.ConfirmResponse;
import com.youlisten.imports.dto.ImportDtos.PreviewResponse;
import com.youlisten.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/imports")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    /** Step 1: upload a CSV/JSON export, get back what was parsed. Nothing is saved yet. */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PreviewResponse> preview(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("The file is empty.");
        }
        try {
            return ResponseEntity.ok(importService.preview(file.getOriginalFilename(), file.getBytes()));
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file.");
        }
    }

    /** Step 2: save the previewed tracks as a playlist. */
    @PostMapping("/confirm")
    public ResponseEntity<ConfirmResponse> confirm(
            @Valid @RequestBody ConfirmRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(importService.confirm(currentUser, request));
    }
}
