package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.service.IEtiquetaService;

@RestController
@RequestMapping("/api/etiquetas")
@RequiredArgsConstructor
@Tag(name = "Etiquetas", description = "Endpoints para gestionar etiquetas")
public class EtiquetaController {

    private final IEtiquetaService service;

    @GetMapping
    @Operation(summary = "Listar etiquetas")
    public ResponseEntity<List<Etiqueta>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Etiqueta> getById(@PathVariable Integer id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    @Operation(summary = "Crear etiqueta")
    public ResponseEntity<Etiqueta> create(@Valid @RequestBody Etiqueta etiqueta) {
        return new ResponseEntity<>(service.save(etiqueta), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Etiqueta> update(@PathVariable Integer id, @Valid @RequestBody Etiqueta etiqueta) {
        return ResponseEntity.ok(service.update(id, etiqueta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
