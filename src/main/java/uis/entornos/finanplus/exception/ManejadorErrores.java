package uis.entornos.finanplus.exception;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Convierte las excepciones en respuestas JSON con un mensaje claro: { "status": 404, "message": "..." }
@RestControllerAdvice
public class ManejadorErrores {

    // @Valid falló (campo vacío, contraseña corta, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst()
                .orElse("Datos inválidos");
        return respuesta(HttpStatus.BAD_REQUEST, mensaje);
    }

    // JSON mal formado o con un valor que no corresponde (ej. una fecha inválida)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> jsonInvalido(HttpMessageNotReadableException e) {
        return respuesta(HttpStatus.BAD_REQUEST, "El formato de los datos enviados no es válido");
    }

    // Login con correo o contraseña incorrectos
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> credenciales(BadCredentialsException e) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
    }

    // Login de un usuario con estado INACTIVO o SUSPENDIDO
    @ExceptionHandler(org.springframework.security.authentication.DisabledException.class)
    public ResponseEntity<Map<String, Object>> cuentaInactiva(org.springframework.security.authentication.DisabledException e) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Tu cuenta está inactiva o suspendida");
    }

    // Borrar algo que otros datos usan (ej. una categoría con registros)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> integridad(DataIntegrityViolationException e) {
        return respuesta(HttpStatus.CONFLICT, "No se puede completar: hay otros datos que dependen de este");
    }

    // Errores lanzados en los services con new RuntimeException("...")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> negocio(RuntimeException e) {
        String mensaje = e.getMessage() != null ? e.getMessage() : "Error inesperado";
        String m = mensaje.toLowerCase();
        // 404 si no existe; el resto 400 (no usar 403: el frontend cierra la sesión con 401/403)
        HttpStatus estado = m.contains("no encontrad") ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return respuesta(estado, mensaje);
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus estado, String mensaje) {
        return ResponseEntity.status(estado).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", estado.value(),
                "message", mensaje));
    }
}