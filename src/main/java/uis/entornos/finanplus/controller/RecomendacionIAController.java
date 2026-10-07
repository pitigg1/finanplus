package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.RecomendacionIA;
import uis.entornos.finanplus.service.RecomendacionIAService;

@RestController
@RequestMapping("/api/recomendaciones")
@RequiredArgsConstructor
public class RecomendacionIAController {
	
	private final RecomendacionIAService recomendacionService;

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
    public ResponseEntity<RecomendacionIA> update (@PathVariable String id,@Valid @RequestBody RecomendacionIA recomendacion) {
    	return ResponseEntity.ok(recomendacionService.update(id, recomendacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        recomendacionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
