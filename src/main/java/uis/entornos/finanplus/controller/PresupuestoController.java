package uis.entornos.finanplus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uis.entornos.finanplus.dto.PresupuestoRequestDTO;
import uis.entornos.finanplus.dto.PresupuestoResponseDTO;
import uis.entornos.finanplus.service.IPresupuestoService;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
@RequiredArgsConstructor
public class PresupuestoController {

    private final IPresupuestoService presupuestoService;

    @PostMapping
    public ResponseEntity<PresupuestoResponseDTO> crear(
            @Valid @RequestBody PresupuestoRequestDTO request,
            Authentication authentication) {
        return new ResponseEntity<>(
                presupuestoService.crear(request, authentication.getName()),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<PresupuestoResponseDTO>> listarPorUsuario(Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.listarPorUsuario(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PresupuestoResponseDTO> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(presupuestoService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoResponseDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody PresupuestoRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(presupuestoService.actualizar(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            Authentication authentication) {
        presupuestoService.eliminar(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}