package uis.entornos.finanplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.service.RegistroFinancieroService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/registros")
@RequiredArgsConstructor
@Tag(name = "Registros Financieros", description = "Endpoints para ingresos y gastos")
public class RegistroFinancieroController {
	private final RegistroFinancieroService service;

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Obtener registros por ID de usuario")
    public ResponseEntity<List<RegistroFinanciero>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(service.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistroFinanciero> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<RegistroFinanciero> create(@Valid @RequestBody RegistroFinanciero registro) {
        return new ResponseEntity<>(service.save(registro), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegistroFinanciero> update(@PathVariable String id, @Valid @RequestBody RegistroFinanciero registro) {
        return ResponseEntity.ok(service.update(id, registro));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
