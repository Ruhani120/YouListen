package com.youlisten.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Thrown for failures talking to Google / YouTube. Never maps to HTTP 401 (the frontend logs the user out on 401).
 * QUOTA_EXCEEDED, REAUTH_REQUIRED and NOT_CONNECTED are "stop the whole job" errors for the transfer worker;
 * NOT_FOUND, DUPLICATE and FORBIDDEN can be handled per track.
 */
@Getter
public class GoogleApiException extends RuntimeException {

    public enum Reason {
        NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE),
        NOT_CONNECTED(HttpStatus.CONFLICT),
        REAUTH_REQUIRED(HttpStatus.CONFLICT),
        NO_CHANNEL(HttpStatus.CONFLICT),
        QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS),
        RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
        FORBIDDEN(HttpStatus.FORBIDDEN),
        NOT_FOUND(HttpStatus.NOT_FOUND),
        DUPLICATE(HttpStatus.CONFLICT),
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

    public GoogleApiException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public String getCode() {
        return "GOOGLE_" + reason.name();
    }

    public HttpStatus getStatus() {
        return reason.status();
    }

    /** Worth retrying a moment later (network blips, 5xx, per-second rate limit). */
    public boolean isTransient() {
        return reason == Reason.UPSTREAM_ERROR || reason == Reason.RATE_LIMITED;
    }

    /** Nothing else in this job can succeed after this error. */
    public boolean isFatalForJob() {
        return reason == Reason.QUOTA_EXCEEDED || reason == Reason.REAUTH_REQUIRED
                || reason == Reason.NOT_CONNECTED || reason == Reason.NOT_CONFIGURED
                || reason == Reason.NO_CHANNEL;
    }
}
