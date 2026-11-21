package com.youlisten.google;

import com.youlisten.config.JwtConfig;
import com.youlisten.exception.BadRequestException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;

/** Signed, short-lived "state" for the Google OAuth round trip (same idea as the Spotify one). */
@Component
@RequiredArgsConstructor
public class GoogleStateService {

    private static final long TTL_MS = 10 * 60 * 1000L;
    private static final String PURPOSE = "google_oauth";

    private final JwtConfig jwtConfig;

    public String create(Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("purpose", PURPOSE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + TTL_MS))
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    public Long verify(String state) {
        try {
            Claims claims = Jwts.parser().verifyWith(key()).build()
                    .parseSignedClaims(state).getPayload();
            if (!PURPOSE.equals(claims.get("purpose", String.class))) {
                throw new BadRequestException("Invalid Google state");
            }
            return Long.parseLong(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new BadRequestException("Invalid or expired Google state");
        }
    }

    private SecretKey key() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((jwtConfig.getSecret() + ":google-oauth-state").getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(digest);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
