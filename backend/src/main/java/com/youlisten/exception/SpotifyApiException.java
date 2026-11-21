package com.youlisten.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Thrown for any Spotify-related failure. Never maps to HTTP 401, because the frontend
 * logs the user out of YouListen on 401.
 */
@Getter
public class SpotifyApiException extends RuntimeException {

    public enum Reason {
        NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE),
        NOT_CONNECTED(HttpStatus.CONFLICT),
        REAUTH_REQUIRED(HttpStatus.CONFLICT),
        FORBIDDEN(HttpStatus.FORBIDDEN),
        RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
        UPSTREAM_ERROR(HttpStatus.BAD_GATEWAY);

        private final HttpStatus status;

        Reason(HttpStatus status) {
            this.status = status;
        }

        public HttpStatus status() {
            return status;
        }
    }

    private final Reason reason;

    public SpotifyApiException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public String getCode() {
        return "SPOTIFY_" + reason.name();
    }

    public HttpStatus getStatus() {
        return reason.status();
    }

    /** Worth retrying a moment later. */
    public boolean isTransient() {
        return reason == Reason.UPSTREAM_ERROR || reason == Reason.RATE_LIMITED;
    }

    /** Nothing else in this job can succeed after this error. */
    public boolean isFatalForJob() {
        return reason == Reason.NOT_CONFIGURED || reason == Reason.NOT_CONNECTED
                || reason == Reason.REAUTH_REQUIRED || reason == Reason.FORBIDDEN;
    }
}
