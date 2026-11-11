-- =========================================================
-- MIGRACIÓN: el tipo de un registro / recurrente es el de su categoría
-- Para bases de datos que YA existen. Las nuevas reglas del backend rechazan los movimientos cuyo tipo
-- no coincide con el de su categoría (ej. un registro INVERSION en la categoría "Comida" de tipo GASTO);
-- este script corrige los datos que ya estaban guardados así.
--
-- Ejecutar UNA sola vez:   mysql -u root -p < database/migracion_tipo_igual_a_categoria.sql
-- Haz una copia de seguridad antes (mysqldump).
-- =========================================================

USE finanplus;

-- 1) (Opcional) Ver qué se va a corregir
SELECT r.id_registro, r.tipo_movimiento AS tipo_registro, c.nombre AS categoria, c.tipo AS tipo_categoria
FROM Registros_Financieros r
JOIN Categorias c ON c.id_categoria = r.id_categoria
WHERE r.tipo_movimiento <> c.tipo;

SELECT m.id_recurrencia, m.tipo_movimiento AS tipo_recurrente, c.nombre AS categoria, c.tipo AS tipo_categoria
FROM Movimientos_Recurrentes m
JOIN Categorias c ON c.id_categoria = m.id_categoria
WHERE m.tipo_movimiento <> c.tipo;

-- 2) Corregir: el tipo pasa a ser el de la categoría
UPDATE Registros_Financieros r
JOIN Categorias c ON c.id_categoria = r.id_categoria
SET r.tipo_movimiento = c.tipo
WHERE r.tipo_movimiento <> c.tipo;

UPDATE Movimientos_Recurrentes m
JOIN Categorias c ON c.id_categoria = m.id_categoria
SET m.tipo_movimiento = c.tipo
WHERE m.tipo_movimiento <> c.tipo;
