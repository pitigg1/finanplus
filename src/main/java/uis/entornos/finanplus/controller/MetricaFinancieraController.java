package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MetricaFinanciera;
import uis.entornos.finanplus.service.MetricaFinancieraService;

@RestController
@RequestMapping("/api/metricas")
@RequiredArgsConstructor
public class MetricaFinancieraController {
	
	private final MetricaFinancieraService metricaService;
	
	@GetMapping("/usuario/{idUsuario}")
	public ResponseEntity<List<MetricaFinanciera>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(metricaService.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetricaFinanciera> getById(@PathVariable String id) {
        return ResponseEntity.ok(metricaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MetricaFinanciera> create(@Valid @RequestBody MetricaFinanciera metrica) {
        return new ResponseEntity<>(metricaService.save(metrica), HttpStatus.CREATED);
    }
    
    @PostMapping("/usuario/{idUsuario}/calcular")
    public ResponseEntity<MetricaFinanciera> calcular(@PathVariable String idUsuario) {
        return new ResponseEntity<>(metricaService.calcular(idUsuario), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        metricaService.delete(id);
        return ResponseEntity.noContent().build();
    }
	

}
