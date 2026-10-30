package uis.entornos.finanplus.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Envía el correo de recuperación. Si no hay un servidor de correo configurado (spring.mail.host),
 * el enlace se imprime en la consola del backend para poder probar el flujo sin correo real.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> remitente;

    @Value("${finanplus.frontend.url:http://127.0.0.1:5500}")
    private String urlFrontend;

    @Value("${spring.mail.username:}")
    private String desde;

    public void enviarRecuperacion(String para, String nombre, String token, int minutosDeVida) {
        String enlace = urlFrontend + "/restablecer.html?token=" + token;
        JavaMailSender sender = remitente.getIfAvailable();

        if (sender == null) {
            log.warn("[RECUPERACIÓN] No hay correo configurado. Enlace para {} (vence en {} min): {}", para, minutosDeVida, enlace);
            return;
        }
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            if (desde != null && !desde.isBlank()) mensaje.setFrom(desde);
            mensaje.setTo(para);
            mensaje.setSubject("Recupera tu contraseña de FinanPlus");
            mensaje.setText("Hola " + nombre + ",\n\n"
                    + "Recibimos una solicitud para cambiar la contraseña de tu cuenta de FinanPlus.\n"
                    + "Entra a este enlace para elegir una nueva (vence en " + minutosDeVida + " minutos y solo sirve una vez):\n\n"
                    + enlace + "\n\n"
                    + "Si no fuiste tú, ignora este correo: tu contraseña sigue igual.\n\n"
                    + "— FinanPlus");
            sender.send(mensaje);
        } catch (Exception e) {
            // si el correo falla no se le dice nada al usuario (no se debe revelar si la cuenta existe);
            // en la consola queda el motivo y el enlace, para que quien administra el sistema pueda ayudar
            log.error("[RECUPERACIÓN] No se pudo enviar el correo a {}: {}", para, e.getMessage());
            log.warn("[RECUPERACIÓN] Enlace para {}: {}", para, enlace);
        }
    }
}
