-- =========================================================
-- MIGRACIÓN: cuentas y seguridad
-- Para bases de datos que YA existen (creadas con una versión anterior de finanplus.sql).
-- Si vas a crear la base desde cero, NO uses este archivo: finanplus.sql ya trae todo.
--
-- Ejecutar UNA sola vez:   mysql -u root -p < database/migracion_cuentas_seguridad.sql
-- Haz una copia de seguridad antes (mysqldump).
-- =========================================================

USE finanplus;

-- 1) Roles de usuario y cierre de sesiones al restablecer la contraseña
ALTER TABLE Usuarios
    ADD COLUMN rol ENUM('USUARIO', 'ADMIN') NOT NULL DEFAULT 'USUARIO',
    ADD COLUMN sesion_version INT NOT NULL DEFAULT 0;

-- Para nombrar al primer administrador (cambia el correo):
-- UPDATE Usuarios SET rol = 'ADMIN' WHERE correo = 'tucorreo@ejemplo.com';
-- (También se puede definir la variable de entorno FINANPLUS_ADMIN_CORREO antes de arrancar el backend.)

-- 2) Categorías propias de cada usuario
-- Las que ya existen quedan con id_usuario = NULL: son "generales" (las ven todos y solo un administrador las cambia).
ALTER TABLE Categorias
    ADD COLUMN id_usuario CHAR(36) NULL,
    ADD CONSTRAINT fk_categoria_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE;

-- 3) Etiquetas propias de cada usuario: el nombre pasa a ser único POR usuario (antes era único para todos)
ALTER TABLE Etiquetas
    ADD COLUMN id_usuario CHAR(36) NULL,
    ADD CONSTRAINT fk_etiqueta_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE;

-- El índice único viejo (solo por nombre) se llama "nombre" si la tabla la creó finanplus.sql.
-- Si la creó Hibernate, tiene otro nombre (algo como UK_xxxx): míralo con  SHOW INDEX FROM Etiquetas;
-- y cambia el nombre en la línea siguiente.
ALTER TABLE Etiquetas DROP INDEX nombre;
ALTER TABLE Etiquetas ADD CONSTRAINT uk_etiqueta_usuario_nombre UNIQUE (nombre, id_usuario);

-- 4) Recuperar contraseña: enlaces de un solo uso (se guarda solo su huella SHA-256)
CREATE TABLE IF NOT EXISTS Tokens_Recuperacion (
    id_token CHAR(36) PRIMARY KEY,
    id_usuario CHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira DATETIME NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    creado DATETIME,
    CONSTRAINT fk_token_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);
