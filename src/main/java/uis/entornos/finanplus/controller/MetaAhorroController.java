package uis.entornos.finanplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.service.IMetaAhorroService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/metas")
@RequiredArgsConstructor
@Tag(name = "Metas de Ahorro", description = "Endpoints para la gestión de metas")
public class MetaAhorroController {

    private final IMetaAhorroService service;

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Listar metas de ahorro por usuario")
    public ResponseEntity<List<MetaAhorro>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(service.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetaAhorro> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nueva meta de ahorro")
    public ResponseEntity<MetaAhorro> create(@Valid @RequestBody MetaAhorro meta) {
        return new ResponseEntity<>(service.save(meta), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MetaAhorro> update(@PathVariable String id, @Valid @RequestBody MetaAhorro meta) {
        return ResponseEntity.ok(service.update(id, meta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
