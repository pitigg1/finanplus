package uis.entornos.finanplus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uis.entornos.finanplus.dto.RegistroFinancieroRequestDTO;
import uis.entornos.finanplus.dto.RegistroFinancieroResponseDTO;
import uis.entornos.finanplus.service.IRegistroFinancieroService;

import java.util.List;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
public class RegistroFinancieroController {

    private final IRegistroFinancieroService registroFinancieroService;

    @PostMapping
    public ResponseEntity<RegistroFinancieroResponseDTO> crear(
            @Valid @RequestBody RegistroFinancieroRequestDTO request,
            Authentication authentication) {
        return new ResponseEntity<>(
                registroFinancieroService.crear(request, authentication.getName()),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<RegistroFinancieroResponseDTO>> listarPorUsuario(Authentication authentication) {
        return ResponseEntity.ok(registroFinancieroService.listarPorUsuario(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistroFinancieroResponseDTO> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(registroFinancieroService.obtenerPorId(id));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RegistroFinancieroResponseDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody RegistroFinancieroRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(registroFinancieroService.actualizar(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            Authentication authentication) {
        registroFinancieroService.eliminar(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}