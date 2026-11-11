package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.RecomendacionIA;
import uis.entornos.finanplus.service.IRecomendacionIAService;

@RestController
@RequestMapping("/api/recomendaciones")
@RequiredArgsConstructor
public class RecomendacionIAController {
	
	// Cambiado a la interfaz para seguir buenas prácticas de Spring
	private final IRecomendacionIAService recomendacionService;

    // --- NUEVO ENDPOINT PARA GEMINI IA ---
    @PostMapping("/generar")
    public ResponseEntity<RecomendacionIA> generarRecomendacion() {
        RecomendacionIA nueva = recomendacionService.generarYGuardarRecomendacionGemini();
        return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
    }

    // --- ENDPOINTS CRUD EXISTENTES EN TU PROYECTO ---
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<RecomendacionIA>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(recomendacionService.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecomendacionIA> getById(@PathVariable String id) {
        return ResponseEntity.ok(recomendacionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<RecomendacionIA> create(@Valid @RequestBody RecomendacionIA recomendacion) {
        return new ResponseEntity<>(recomendacionService.save(recomendacion), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RecomendacionIA> update(@PathVariable String id, @Valid @RequestBody RecomendacionIA recomendacion) {
    	return ResponseEntity.ok(recomendacionService.update(id, recomendacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        recomendacionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}