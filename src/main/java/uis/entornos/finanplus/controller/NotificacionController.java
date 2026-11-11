package uis.entornos.finanplus.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Notificacion;
import uis.entornos.finanplus.service.IAlertaAutomaticaService;
import uis.entornos.finanplus.service.NotificacionService;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
	
	private final NotificacionService notificacionService;
	private final IAlertaAutomaticaService alertaService;

    // Normalmente las alertas se generan solas (al guardar registros y cada día a las 00:30);
    // este endpoint fuerza la revisión ahora mismo para el usuario autenticado (útil para probar).
    @PostMapping("/evaluar")
    public ResponseEntity<Map<String, Integer>> evaluar(Authentication authentication) {
        return ResponseEntity.ok(Map.of("notificacionesCreadas", alertaService.evaluarUsuario(authentication.getName())));
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Notificacion>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(notificacionService.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notificacion> getById(@PathVariable String id) {
        return ResponseEntity.ok(notificacionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Notificacion> create(@Valid @RequestBody Notificacion notificacion) {
        return new ResponseEntity<>(notificacionService.save(notificacion), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notificacion> update(@PathVariable String id, @RequestBody Notificacion notificacion) {
        return ResponseEntity.ok(notificacionService.update(id, notificacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        notificacionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
