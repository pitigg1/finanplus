package uis.entornos.finanplus.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Guarda las fotos de perfil como archivos en el disco del servidor (carpeta uploads/perfiles).
 * El nombre del archivo es siempre "<id del usuario>.jpg": nunca depende de lo que envíe el cliente,
 * así que nadie puede escribir ni leer fuera de esa carpeta.
 */
@Component
public class AlmacenFotos {

    private final Path carpeta;

    public AlmacenFotos(@Value("${finanplus.uploads.dir:uploads}") String directorioBase) {
        this.carpeta = Paths.get(directorioBase, "perfiles").toAbsolutePath().normalize();
    }

    private Path ruta(String idUsuario) {
        Path archivo = carpeta.resolve(idUsuario + ".jpg").normalize();
        if (!archivo.startsWith(carpeta)) {
            throw new IllegalArgumentException("Ruta no permitida");
        }
        return archivo;
    }

    public void guardar(String idUsuario, byte[] jpeg) throws IOException {
        Files.createDirectories(carpeta);
        Files.write(ruta(idUsuario), jpeg);
    }

    public Optional<byte[]> leer(String idUsuario) {
        try {
            Path archivo = ruta(idUsuario);
            return Files.exists(archivo) ? Optional.of(Files.readAllBytes(archivo)) : Optional.empty();
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public void borrar(String idUsuario) {
        try {
            Files.deleteIfExists(ruta(idUsuario));
        } catch (IOException e) {
            // si no se puede borrar el archivo, no se bloquea lo demás
        }
    }
}
