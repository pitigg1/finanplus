package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.service.IRegistroEtiquetaService;

@RestController
@RequestMapping("/api/registros/{idRegistro}/etiquetas")
@RequiredArgsConstructor
@Tag(name = "Etiquetas de Registros", description = "Asignar y quitar etiquetas a registros financieros")
public class RegistroEtiquetaController {

    private final IRegistroEtiquetaService service;

    @GetMapping
    @Operation(summary = "Listar etiquetas de un registro")
    public ResponseEntity<List<Etiqueta>> getEtiquetas(@PathVariable String idRegistro) {
        return ResponseEntity.ok(service.findEtiquetasByRegistro(idRegistro));
    }

    @PostMapping("/{idEtiqueta}")
    @Operation(summary = "Asignar etiqueta a un registro")
    public ResponseEntity<Void> asignar(@PathVariable String idRegistro, @PathVariable Integer idEtiqueta) {
        service.asignar(idRegistro, idEtiqueta);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @DeleteMapping("/{idEtiqueta}")
    @Operation(summary = "Quitar etiqueta de un registro")
    public ResponseEntity<Void> quitar(@PathVariable String idRegistro, @PathVariable Integer idEtiqueta) {
        service.quitar(idRegistro, idEtiqueta);
        return ResponseEntity.noContent().build();
    }
}
