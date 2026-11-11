package uis.entornos.finanplus.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.PronosticoInversionDTO;
import uis.entornos.finanplus.dto.PronosticoPortafolioDTO;
import uis.entornos.finanplus.model.Inversion;
import uis.entornos.finanplus.service.IPronosticoInversionService;
import uis.entornos.finanplus.service.InversionService;

@RestController
@RequestMapping("/api/inversiones")
@RequiredArgsConstructor
public class InversionController {
	private final InversionService inversionService;
	private final IPronosticoInversionService pronosticoService;

    // Pronóstico de TODAS las inversiones del usuario autenticado. Cada una se proyecta con su propia
    // rentabilidad (o con la tasa por defecto si no tiene).
    // Ej: GET /api/inversiones/pronostico?meses=24
    @GetMapping("/pronostico")
    public ResponseEntity<PronosticoPortafolioDTO> pronosticoPortafolio(
            @RequestParam(defaultValue = "12") Integer meses,
            Authentication authentication) {
        return ResponseEntity.ok(pronosticoService.pronosticarPortafolio(authentication.getName(), meses));
    }

    // Pronóstico de UNA inversión. Usa su rentabilidad; tasaAnual (en %), si se envía, la reemplaza. aporteMensual es opcional.
    // Ej: GET /api/inversiones/{id}/pronostico?meses=36&tasaAnual=11.5&aporteMensual=200000
    @GetMapping("/{id}/pronostico")
    public ResponseEntity<PronosticoInversionDTO> pronostico(
            @PathVariable String id,
            @RequestParam(defaultValue = "12") Integer meses,
            @RequestParam(required = false) BigDecimal tasaAnual,
            @RequestParam(required = false) BigDecimal aporteMensual,
            Authentication authentication) {
        return ResponseEntity.ok(
                pronosticoService.pronosticar(id, authentication.getName(), meses, tasaAnual, aporteMensual));
    }

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
