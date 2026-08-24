package com.example.BreatheESG.security;

import io.jsonwebtoken.Jwts;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtGenerator {

    // Modern JJWT 0.12+ syntax to generate a secure SecretKey for HS512
    private static final SecretKey key = Jwts.SIG.HS512.key().build();

    // Token validity: 24 hours in milliseconds
    private static final long JWT_EXPIRATION = 86400000;

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + JWT_EXPIRATION);

        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(expireDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        return Jwts.parser()
                .verifyWith(key) // Updated validation method
                .build()
                .parseSignedClaims(token) // Updated from parseClaimsJws
                .getPayload() // Updated from getBody
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            // In a production environment, you would log the exact exception here
            return false;
        }
    }
}