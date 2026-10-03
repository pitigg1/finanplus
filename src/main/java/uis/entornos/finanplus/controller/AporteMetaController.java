package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.AporteMeta;
import uis.entornos.finanplus.service.IAporteMetaService;

@RestController
@RequestMapping("/api/aportes")
@RequiredArgsConstructor
@Tag(name = "Aportes a Metas", description = "Endpoints para registrar aportes a metas de ahorro")
public class AporteMetaController {

    private final IAporteMetaService service;

    @GetMapping("/meta/{idMeta}")
    @Operation(summary = "Listar aportes de una meta")
    public ResponseEntity<List<AporteMeta>> getByMeta(@PathVariable String idMeta) {
        return ResponseEntity.ok(service.findAllByMeta(idMeta));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AporteMeta> getById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    @Operation(summary = "Registrar aporte (suma al monto actual de la meta)")
    public ResponseEntity<AporteMeta> create(@Valid @RequestBody AporteMeta aporte) {
        return new ResponseEntity<>(service.save(aporte), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AporteMeta> update(@PathVariable String id, @Valid @RequestBody AporteMeta aporte) {
        return ResponseEntity.ok(service.update(id, aporte));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
