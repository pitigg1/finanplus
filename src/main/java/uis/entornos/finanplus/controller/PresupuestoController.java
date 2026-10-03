package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Presupuesto;
import uis.entornos.finanplus.service.IPresupuestoService;

@RestController
@RequestMapping("/api/presupuestos")
@RequiredArgsConstructor
@Tag(name = "Presupuestos", description = "Endpoints para gestionar presupuestos mensuales")
public class PresupuestoController {

    private final IPresupuestoService service;

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Listar presupuestos de un usuario")
    public ResponseEntity<List<Presupuesto>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(service.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Presupuesto> getById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    @Operation(summary = "Crear presupuesto")
    public ResponseEntity<Presupuesto> create(@Valid @RequestBody Presupuesto presupuesto) {
        return new ResponseEntity<>(service.save(presupuesto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Presupuesto> update(@PathVariable String id, @Valid @RequestBody Presupuesto presupuesto) {
        return ResponseEntity.ok(service.update(id, presupuesto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
