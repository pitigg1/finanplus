package uis.entornos.finanplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.service.CategoriaService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "Endpoints para gestionar categorías de movimientos")
public class CategoriaController {
    
    private final CategoriaService service;

    @GetMapping
    @Operation(summary = "Listar categorías")
    public ResponseEntity<List<Categoria>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Categoria> getById(@PathVariable Integer id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    public ResponseEntity<Categoria> create(@Valid @RequestBody Categoria categoria) {
        return new ResponseEntity<>(service.save(categoria), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categoria> update(@PathVariable Integer id, @Valid @RequestBody Categoria categoria) {
        return ResponseEntity.ok(service.update(id, categoria));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}