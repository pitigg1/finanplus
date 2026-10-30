package uis.entornos.finanplus.security;

import java.security.SecureRandom;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;
import uis.entornos.finanplus.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.function.Function;

@Service
public class JwtService {

    // La clave que firma los tokens de sesión NO puede estar en el código (el repositorio es público: con ella
    // cualquiera podría fabricar un token y entrar como otra persona). Se define con la variable de entorno JWT_SECRET
    // (texto Base64 de al menos 32 bytes). Si no se define, se genera una al azar cada vez que arranca el backend:
    // es seguro, pero las sesiones se cierran al reiniciar.
    @Value("${jwt.secret:}")
    private String secretKey;

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @PostConstruct
    void prepararClave() {
        if (secretKey == null || secretKey.isBlank()) {
            byte[] azar = new byte[32];
            new SecureRandom().nextBytes(azar);
            secretKey = Base64.getEncoder().encodeToString(azar);
            log.warn("[SEGURIDAD] No hay JWT_SECRET configurada: se generó una clave temporal. Las sesiones se cerrarán al reiniciar el backend.");
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // La versión de sesión viaja dentro del token ("sv"). Si cambia en la base de datos, el token deja de servir.
    private java.util.Map<String, Object> reclamosDe(UserDetails userDetails) {
        java.util.Map<String, Object> reclamos = new HashMap<>();
        if (userDetails instanceof Usuario usuario) reclamos.put("sv", usuario.versionDeSesion());
        return reclamos;
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(reclamosDe(userDetails))
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 horas
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token)) return false;
        // si la contraseña se restableció después de emitir este token, la versión ya no coincide y el token no sirve
        if (userDetails instanceof Usuario usuario) {
            Integer version = extractClaim(token, claims -> claims.get("sv", Integer.class));
            if ((version == null ? 0 : version) != usuario.versionDeSesion()) return false;
        }
        return true;
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build().parseClaimsJws(token).getBody();
        return claimsResolver.apply(claims);
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
