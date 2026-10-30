package uis.entornos.finanplus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uis.entornos.finanplus.dto.AuthResponseDTO;
import uis.entornos.finanplus.dto.LoginRequestDTO;
import uis.entornos.finanplus.dto.RegistroUsuarioDTO;
import uis.entornos.finanplus.service.IAuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;
    private final uis.entornos.finanplus.service.RecuperacionService recuperacionService;

    @PostMapping("/registro")
    public ResponseEntity<AuthResponseDTO> registrar(@Valid @RequestBody RegistroUsuarioDTO request) {
        return ResponseEntity.ok(authService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Pide el enlace para cambiar la contraseña. Siempre responde lo mismo, exista o no el correo.
    @PostMapping("/olvide-password")
    public ResponseEntity<java.util.Map<String, String>> olvidePassword(@Valid @RequestBody uis.entornos.finanplus.dto.OlvidePasswordDTO request) {
        recuperacionService.solicitar(request.getCorreo());
        return ResponseEntity.ok(java.util.Map.of("message",
                "Si el correo está registrado, te enviamos un enlace para cambiar tu contraseña. Vence en "
                        + uis.entornos.finanplus.service.RecuperacionService.MINUTOS_DE_VIDA + " minutos."));
    }

    // Cambia la contraseña con el enlace recibido por correo.
    @PostMapping("/restablecer-password")
    public ResponseEntity<java.util.Map<String, String>> restablecerPassword(@Valid @RequestBody uis.entornos.finanplus.dto.RestablecerPasswordDTO request) {
        recuperacionService.restablecer(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Listo: ya puedes iniciar sesión con tu nueva contraseña."));
    }
}
