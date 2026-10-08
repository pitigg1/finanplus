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

    @PostMapping("/registro")
    public ResponseEntity<AuthResponseDTO> registrar(@Valid @RequestBody RegistroUsuarioDTO request) {
        return ResponseEntity.ok(authService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }
}