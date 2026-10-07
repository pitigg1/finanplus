package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Inversion;
import uis.entornos.finanplus.service.InversionService;

@RestController
@RequestMapping("/api/inversiones")
@RequiredArgsConstructor
public class InversionController {
	private final InversionService inversionService;

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Inversion>> getByUsuario(@PathVariable String idUsuario) {
        return ResponseEntity.ok(inversionService.findAllByUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inversion> getById(@PathVariable String id) {
        return ResponseEntity.ok(inversionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Inversion> create(@Valid @RequestBody Inversion inversion) {
        return new ResponseEntity<>(inversionService.save(inversion), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inversion> update (@PathVariable String id,@Valid @RequestBody Inversion inversion) {
    	return ResponseEntity.ok(inversionService.update(id, inversion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete (@PathVariable String id) {
        inversionService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
