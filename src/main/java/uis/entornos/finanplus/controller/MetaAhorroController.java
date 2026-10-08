package uis.entornos.finanplus.controller;


import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.MetaAhorroResponseDTO;
import uis.entornos.finanplus.service.IMetaAhorroService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;
import uis.entornos.finanplus.dto.MetaAhorroRequestDTO;


@RestController
@RequestMapping("/api/metas")
@RequiredArgsConstructor
@Tag(name = "Metas de Ahorro", description = "Endpoints para la gestión de metas")
public class MetaAhorroController {

	private final IMetaAhorroService metaAhorroService;

    @PostMapping
    public ResponseEntity<MetaAhorroResponseDTO> crear(
            @Valid @RequestBody MetaAhorroRequestDTO request,
            Authentication authentication) {
        return new ResponseEntity<>(
                metaAhorroService.crear(request, authentication.getName()),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<MetaAhorroResponseDTO>> listarPorUsuario(Authentication authentication) {
        return ResponseEntity.ok(metaAhorroService.listarPorUsuario(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetaAhorroResponseDTO> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(metaAhorroService.obtenerPorId(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            Authentication authentication) {
        metaAhorroService.eliminar(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
