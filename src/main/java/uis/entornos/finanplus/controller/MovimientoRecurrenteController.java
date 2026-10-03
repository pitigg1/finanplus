package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MovimientoRecurrente;
import uis.entornos.finanplus.service.IMovimientoRecurrenteService;

@RestController
@RequestMapping("/api/recurrentes")
@RequiredArgsConstructor
@Tag(name = "Movimientos Recurrentes", description = "Endpoints para ingresos y gastos que se repiten")
public class MovimientoRecurrenteController {

    private final IMovimientoRecurrenteService service;

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Listar movimientos recurrentes de un usuario")
    public ResponseEntity<List<MovimientoRecurrente>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(service.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener movimiento recurrente por ID")
    public ResponseEntity<MovimientoRecurrente> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear movimiento recurrente")
    public ResponseEntity<MovimientoRecurrente> create(@Valid @RequestBody MovimientoRecurrente movimiento) {
        return new ResponseEntity<>(service.save(movimiento), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar movimiento recurrente (también sirve para activar/desactivar)")
    public ResponseEntity<MovimientoRecurrente> update(@PathVariable String id,
            @Valid @RequestBody MovimientoRecurrente movimiento) {
        return ResponseEntity.ok(service.update(id, movimiento));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar movimiento recurrente")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}