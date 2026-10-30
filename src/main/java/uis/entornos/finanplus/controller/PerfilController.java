package uis.entornos.finanplus.controller;

import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.ActualizarPerfilDTO;
import uis.entornos.finanplus.dto.CambiarPasswordDTO;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.service.PerfilService;

// Perfil de la persona con la sesión abierta. (GET /api/usuarios/perfil está en UsuarioController.)
@RestController
@RequestMapping("/api/usuarios/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;

    @PutMapping
    public ResponseEntity<UsuarioResponseDTO> actualizar(@Valid @RequestBody ActualizarPerfilDTO datos) {
        return ResponseEntity.ok(perfilService.actualizar(datos));
    }

    // Devuelve un token nuevo: las sesiones abiertas en otros dispositivos se cierran.
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> cambiarPassword(@Valid @RequestBody CambiarPasswordDTO datos) {
        String token = perfilService.cambiarPassword(datos);
        return ResponseEntity.ok(Map.of("token", token, "message", "Contraseña actualizada"));
    }

    @PostMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioResponseDTO> subirFoto(@RequestParam("foto") MultipartFile foto) {
        return ResponseEntity.ok(perfilService.guardarFoto(foto));
    }

    @GetMapping("/foto")
    public ResponseEntity<byte[]> verFoto() {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noCache().cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .body(perfilService.leerFoto());
    }

    @DeleteMapping("/foto")
    public ResponseEntity<UsuarioResponseDTO> borrarFoto() {
        return ResponseEntity.ok(perfilService.borrarFoto());
    }
}
