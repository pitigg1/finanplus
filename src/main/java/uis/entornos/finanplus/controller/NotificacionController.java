package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Notificacion;
import uis.entornos.finanplus.service.NotificacionService;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
	
	private final NotificacionService notificacionService;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        notificacionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
