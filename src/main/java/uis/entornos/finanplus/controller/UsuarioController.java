package uis.entornos.finanplus.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.service.IUsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final IUsuarioService usuarioService;

    @GetMapping("/perfil")
    public ResponseEntity<UsuarioResponseDTO> obtenerPerfilActual(Authentication authentication) {
        return ResponseEntity.ok(usuarioService.obtenerPorCorreo(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }
}