package uis.entornos.finanplus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Endpoints para la gestión de usuarios")
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    @Operation(summary = "Listar todos los usuarios")
    public ResponseEntity<List<Usuario>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario por ID")
    public ResponseEntity<Usuario> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo usuario")
    public ResponseEntity<Usuario> create(@Valid @RequestBody Usuario usuario) {
        return new ResponseEntity<>(service.save(usuario), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un usuario existente")
    public ResponseEntity<Usuario> update(@PathVariable String id, @Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(service.update(id, usuario));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un usuario")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}