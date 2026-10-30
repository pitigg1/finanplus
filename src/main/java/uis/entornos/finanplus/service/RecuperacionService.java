package uis.entornos.finanplus.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.model.TokenRecuperacion;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.TokenRecuperacionRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

/**
 * Recuperar contraseña (HU-03):
 *  - solicitar(): genera un enlace de un solo uso que vence en 30 minutos y lo envía por correo.
 *    Nunca dice si el correo existe (para que nadie pueda averiguar qué cuentas hay).
 *  - restablecer(): con el enlace, cambia la contraseña; la anterior deja de servir y se cierran las sesiones abiertas.
 */
@Service
@RequiredArgsConstructor
public class RecuperacionService {

    public static final int MINUTOS_DE_VIDA = 30;
    private static final int SEGUNDOS_ENTRE_SOLICITUDES = 60;
    private static final String ENLACE_INVALIDO = "El enlace no es válido o ya venció. Pide uno nuevo.";

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacionRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private final SecureRandom aleatorio = new SecureRandom();

    @Transactional
    public void solicitar(String correo) {
        usuarioRepository.findByCorreo(correo.trim())
                .filter(u -> u.getEstado() == EstadoUsuario.ACTIVO)
                .ifPresent(this::crearYEnviar);
        // si no existe (o está inactiva) no pasa nada y la respuesta es idéntica
    }

    private void crearYEnviar(Usuario usuario) {
        // evita que alguien llene la bandeja de otra persona: máximo un enlace por minuto
        boolean muyReciente = tokenRepository.findFirstByUsuarioIdUsuarioOrderByCreadoDesc(usuario.getIdUsuario())
                .map(t -> t.getCreado() != null && t.getCreado().isAfter(LocalDateTime.now().minusSeconds(SEGUNDOS_ENTRE_SOLICITUDES)))
                .orElse(false);
        if (muyReciente) return;

        // los enlaces anteriores dejan de servir
        tokenRepository.findByUsuarioIdUsuarioAndUsadoFalse(usuario.getIdUsuario()).forEach(t -> t.setUsado(true));

        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenRepository.save(TokenRecuperacion.builder()
                .usuario(usuario)
                .tokenHash(hash(token))
                .expira(LocalDateTime.now().plusMinutes(MINUTOS_DE_VIDA))
                .build());

        mailService.enviarRecuperacion(usuario.getCorreo(), usuario.getNombre(), token, MINUTOS_DE_VIDA);
    }

    @Transactional
    public void restablecer(String token, String nuevaPassword) {
        TokenRecuperacion registro = tokenRepository.findByTokenHash(hash(token.trim()))
                .orElseThrow(() -> new RuntimeException(ENLACE_INVALIDO));
        if (Boolean.TRUE.equals(registro.getUsado()) || registro.getExpira().isBefore(LocalDateTime.now())) {
            throw new RuntimeException(ENLACE_INVALIDO);
        }

        Usuario usuario = registro.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuario.setSesionVersion(usuario.versionDeSesion() + 1);   // las sesiones abiertas (por ejemplo la de quien robó la clave) dejan de servir
        usuarioRepository.save(usuario);

        // este enlace y cualquier otro pendiente quedan usados
        registro.setUsado(true);
        tokenRepository.findByUsuarioIdUsuarioAndUsadoFalse(usuario.getIdUsuario()).forEach(t -> t.setUsado(true));
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
