package com.youlisten.google;

import com.youlisten.config.GoogleConfig;
import com.youlisten.google.dto.GoogleDtos.AuthorizeUrlResponse;
import com.youlisten.google.dto.GoogleDtos.StatusResponse;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/google")
@RequiredArgsConstructor
public class GoogleController {

    private final GoogleService googleService;
    private final GoogleConfig config;

    @GetMapping("/status")
    public ResponseEntity<StatusResponse> status(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(googleService.getStatus(currentUser));
    }

    @GetMapping("/connect")
    public ResponseEntity<AuthorizeUrlResponse> connect(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(new AuthorizeUrlResponse(googleService.createAuthorizeUrl(currentUser)));
    }

    /** Public on purpose: Google redirects the browser here. The signed state identifies the user. */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {
        String result = googleService.handleCallback(code, state, error);
        String base = config.getFrontendUrl().replaceAll("/+$", "");
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(base + "/app/connections?google=" + result))
                .build();
    }

    @DeleteMapping("/connection")
    public ResponseEntity<Void> disconnect(@AuthenticationPrincipal User currentUser) {
        googleService.disconnect(currentUser);
        return ResponseEntity.noContent().build();
    }
}
