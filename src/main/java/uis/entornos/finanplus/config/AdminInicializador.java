package uis.entornos.finanplus.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.Rol;
import uis.entornos.finanplus.repository.UsuarioRepository;

/**
 * Al arrancar:
 *  1) los usuarios antiguos que no tienen rol pasan a USUARIO;
 *  2) si está configurado FINANPLUS_ADMIN_CORREO y esa cuenta ya existe, pasa a ADMIN.
 * (Si la cuenta todavía no existe, será ADMIN en cuanto se registre; ver AuthService.)
 */
@Component
@RequiredArgsConstructor
public class AdminInicializador implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;

    @Value("${finanplus.admin.correo:}")
    private String correoAdmin;

    @Override
    public void run(ApplicationArguments args) {
        usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == null)
                .forEach(u -> {
                    u.setRol(Rol.USUARIO);
                    usuarioRepository.save(u);
                });

        if (correoAdmin == null || correoAdmin.isBlank()) return;
        usuarioRepository.findByCorreo(correoAdmin.trim()).ifPresent(u -> {
            if (u.getRol() != Rol.ADMIN) {
                u.setRol(Rol.ADMIN);
                usuarioRepository.save(u);
            }
        });
    }
}
