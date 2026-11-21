package com.youlisten.google;

import com.fasterxml.jackson.databind.JsonNode;
import com.youlisten.config.GoogleConfig;
import com.youlisten.exception.GoogleApiException;
import com.youlisten.exception.GoogleApiException.Reason;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Google OAuth 2.0 (authorization code flow, offline access so we get a refresh token). */
@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthClient {

    /** Manage the user's YouTube account: needed to create playlists and add videos. */
    public static final String SCOPE = "https://www.googleapis.com/auth/youtube";

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn, String scope) {
    }

    private final GoogleConfig config;

    private final RestClient http = RestClient.builder()
            .requestFactory(timeouts())
            .build();

    private static SimpleClientHttpRequestFactory timeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(20_000);
        return factory;
    }

    public String buildAuthorizeUrl(String state) {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + enc(config.getClientId())
                + "&redirect_uri=" + enc(config.getRedirectUri())
                + "&response_type=code"
                + "&scope=" + enc(SCOPE)
                + "&access_type=offline"
                + "&prompt=consent"
                + "&include_granted_scopes=true"
                + "&state=" + enc(state);
    }

    public TokenResponse exchangeCode(String code) {
        MultiValueMap<String, String> form = baseForm();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", config.getRedirectUri());
        return tokenRequest(form);
    }

    public TokenResponse refresh(String refreshToken) {
        MultiValueMap<String, String> form = baseForm();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        return tokenRequest(form);
    }

    /** Best effort: failures are ignored, the local connection is removed either way. */
    public void revoke(String token) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("token", token);
            http.post().uri("https://oauth2.googleapis.com/revoke")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException e) {
            log.info("Google token revoke failed (ignored): {}", e.getMessage());
        }
    }

    private MultiValueMap<String, String> baseForm() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", config.getClientId());
        form.add("client_secret", config.getClientSecret());
        return form;
    }

    private TokenResponse tokenRequest(MultiValueMap<String, String> form) {
        try {
            JsonNode body = http.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null || !body.hasNonNull("access_token")) {
                throw new GoogleApiException(Reason.UPSTREAM_ERROR, "Google returned no access token.");
            }
            return new TokenResponse(
                    body.get("access_token").asText(),
                    body.hasNonNull("refresh_token") ? body.get("refresh_token").asText() : null,
                    body.path("expires_in").asLong(3600),
                    body.path("scope").asText(""));
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString();
            log.warn("Google token endpoint responded {}: {}", e.getStatusCode().value(),
                    body.length() > 300 ? body.substring(0, 300) : body);
            if (body.contains("invalid_grant")) {
                throw new GoogleApiException(Reason.REAUTH_REQUIRED,
                        "Your Google authorization expired or was revoked. Please reconnect Google.");
            }
            if (body.contains("invalid_client") || body.contains("unauthorized_client")) {
                throw new GoogleApiException(Reason.NOT_CONFIGURED,
                        "Google rejected the client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
            }
            throw new GoogleApiException(Reason.UPSTREAM_ERROR,
                    "Google returned an error (" + e.getStatusCode().value() + ") during sign-in.");
        } catch (RestClientException e) {
            log.warn("Google token endpoint unreachable: {}", e.getMessage());
            throw new GoogleApiException(Reason.UPSTREAM_ERROR, "Could not reach Google. Try again in a moment.");
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
