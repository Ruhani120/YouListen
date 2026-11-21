package com.youlisten.google;

import com.youlisten.config.GoogleConfig;
import com.youlisten.config.SpotifyConfig;
import com.youlisten.exception.BadRequestException;
import com.youlisten.exception.GoogleApiException;
import com.youlisten.exception.GoogleApiException.Reason;
import com.youlisten.google.dto.GoogleDtos.StatusResponse;
import com.youlisten.platform.ConnectedAccount;
import com.youlisten.platform.ConnectedAccountRepository;
import com.youlisten.platform.Platform;
import com.youlisten.platform.PlatformRepository;
import com.youlisten.user.User;
import com.youlisten.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/** Connect / disconnect a Google (YouTube) account and hand out valid access tokens. */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleService {

    private static final String PLATFORM = "youtube";

    private final GoogleConfig config;
    private final SpotifyConfig spotifyConfig;     // owns the token-encryption key shared by both integrations
    private final GoogleOAuthClient oauthClient;
    private final YouTubeApiClient youTube;
    private final GoogleStateService stateService;
    private final com.youlisten.spotify.TokenCrypto crypto;
    private final ConnectedAccountRepository accountRepository;
    private final PlatformRepository platformRepository;
    private final UserRepository userRepository;

    // ───────────────────────── connect / callback ─────────────────────────

    public String createAuthorizeUrl(User user) {
        requireConfigured();
        return oauthClient.buildAuthorizeUrl(stateService.create(user.getId()));
    }

    /**
     * Returns the result code for the frontend redirect:
     * connected | no_channel | no_refresh | scope_missing | denied | invalid_state | error
     */
    public String handleCallback(String code, String state, String error) {
        if (!isConfigured()) {
            return "error";
        }
        if (error != null || code == null || code.isBlank()) {
            return "denied";
        }

        User user;
        try {
            user = userRepository.findById(stateService.verify(state)).orElse(null);
        } catch (BadRequestException e) {
            return "invalid_state";
        }
        if (user == null) {
            return "invalid_state";
        }

        try {
            GoogleOAuthClient.TokenResponse tokens = oauthClient.exchangeCode(code);

            if (tokens.scope() == null || !tokens.scope().contains("auth/youtube")) {
                return "scope_missing";     // user unticked the YouTube permission on Google's consent screen
            }

            String result = "connected";
            String channelId = null;
            String channelTitle = null;
            try {
                String[] channel = youTube.getMyChannel(tokens.accessToken());
                if (channel == null) {
                    result = "no_channel";
                } else {
                    channelId = channel[0];
                    channelTitle = channel[1];
                }
            } catch (GoogleApiException e) {
                if (e.getReason() == Reason.NO_CHANNEL) {
                    result = "no_channel";
                } else {
                    log.warn("Could not read YouTube channel after sign-in: {}", e.getMessage());
                }
            }

            boolean hadRefresh = saveConnection(user, tokens, channelId, channelTitle);
            if (!hadRefresh) {
                return "no_refresh";
            }
            return result;
        } catch (GoogleApiException e) {
            log.warn("Google callback failed: {}", e.getMessage());
            return "error";
        } catch (RuntimeException e) {
            log.error("Unexpected error in Google callback", e);
            return "error";
        }
    }

    /** Returns false when we ended up with no refresh token at all (the connection would die in an hour). */
    private boolean saveConnection(User user, GoogleOAuthClient.TokenResponse tokens,
                                   String channelId, String channelTitle) {
        Platform platform = platformRepository.findByName(PLATFORM)
                .orElseThrow(() -> new IllegalStateException("'youtube' row missing in platforms table"));

        ConnectedAccount account = accountRepository.findByUserIdAndPlatformName(user.getId(), PLATFORM)
                .orElseGet(() -> ConnectedAccount.builder().user(user).platform(platform).build());

        if (channelId != null) {
            account.setPlatformUserId(channelId);
        }
        if (channelTitle != null) {
            account.setPlatformUsername(channelTitle);
        }
        applyTokens(account, tokens);
        account.setActive(true);
        accountRepository.save(account);
        return account.getRefreshToken() != null;
    }

    private void applyTokens(ConnectedAccount account, GoogleOAuthClient.TokenResponse tokens) {
        account.setAccessToken(crypto.encrypt(tokens.accessToken()));
        if (tokens.refreshToken() != null) {
            account.setRefreshToken(crypto.encrypt(tokens.refreshToken()));
        }
        account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokens.expiresIn()));
        account.setScope(tokens.scope());
    }

    // ───────────────────────── status / disconnect ─────────────────────────

    public StatusResponse getStatus(User user) {
        Optional<ConnectedAccount> account = findActive(user.getId());
        boolean connected = account.isPresent();
        String mode = config.hasApiKey() ? "api_key" : connected ? "account" : "none";
        return new StatusResponse(
                isConfigured(),
                connected,
                config.hasApiKey(),
                mode,
                account.map(ConnectedAccount::getPlatformUsername).orElse(null),
                account.map(ConnectedAccount::getPlatformUserId).orElse(null),
                account.map(ConnectedAccount::getConnectedAt).orElse(null));
    }

    public void disconnect(User user) {
        accountRepository.findByUserIdAndPlatformName(user.getId(), PLATFORM).ifPresent(account -> {
            try {
                if (account.getRefreshToken() != null) {
                    oauthClient.revoke(crypto.decrypt(account.getRefreshToken()));
                }
            } catch (RuntimeException e) {
                log.info("Could not revoke Google token (ignored): {}", e.getMessage());
            }
            accountRepository.delete(account);
        });
    }

    // ───────────────────────── tokens ─────────────────────────

    public boolean isConnected(Long userId) {
        return findActive(userId).isPresent();
    }

    /** A valid access token for the user's YouTube account. Throws NOT_CONNECTED / REAUTH_REQUIRED. */
    public String accessToken(Long userId) {
        requireConfigured();
        ConnectedAccount account = findActive(userId).orElseThrow(() ->
                new GoogleApiException(Reason.NOT_CONNECTED, "Google is not connected. Connect your Google account first."));

        LocalDateTime expiresAt = account.getTokenExpiresAt();
        boolean stillValid = expiresAt != null && expiresAt.isAfter(LocalDateTime.now().plusSeconds(60));
        if (stillValid) {
            return crypto.decrypt(account.getAccessToken());
        }
        if (account.getRefreshToken() == null) {
            throw new GoogleApiException(Reason.REAUTH_REQUIRED, "Please reconnect your Google account.");
        }
        try {
            GoogleOAuthClient.TokenResponse tokens = oauthClient.refresh(crypto.decrypt(account.getRefreshToken()));
            applyTokens(account, tokens);
            accountRepository.save(account);
            return tokens.accessToken();
        } catch (GoogleApiException e) {
            if (e.getReason() == Reason.REAUTH_REQUIRED) {
                accountRepository.delete(account);   // revoked or expired (Google test apps expire after 7 days)
            }
            throw e;
        }
    }

    /** Access token if connected, otherwise null. Used for matching when an API key can do the search instead. */
    public String accessTokenOrNull(Long userId) {
        if (!isConnected(userId)) {
            return null;
        }
        try {
            return accessToken(userId);
        } catch (GoogleApiException e) {
            return null;
        }
    }

    // ───────────────────────── helpers ─────────────────────────

    private boolean isConfigured() {
        return config.isOAuthConfigured()
                && spotifyConfig.getTokenEncryptionKey() != null
                && spotifyConfig.getTokenEncryptionKey().trim().length() >= 16;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new GoogleApiException(Reason.NOT_CONFIGURED,
                    "Google is not configured on this server (missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET "
                            + "or SPOTIFY_TOKEN_ENCRYPTION_KEY).");
        }
    }

    private Optional<ConnectedAccount> findActive(Long userId) {
        return accountRepository.findByUserIdAndPlatformName(userId, PLATFORM)
                .filter(a -> a.isActive() && a.getAccessToken() != null);
    }
}
