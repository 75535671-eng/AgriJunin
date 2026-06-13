-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS — AgriJunín (3FN)
-- Lógica de negocio centralizada en MySQL/MariaDB
-- ============================================================

USE agri_junin;

DELIMITER $$

-- ------------------------------------------------------------
-- Autenticación y usuarios
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_usuario_buscar_login$$
CREATE PROCEDURE sp_usuario_buscar_login(IN p_login VARCHAR(180))
BEGIN
  IF p_login REGEXP '^[0-9]{8}$' THEN
    SELECT u.id, u.nombre, u.email, u.dni, u.password, r.codigo AS rol,
           u.activo, u.estado_cuenta, u.avatar_url, u.created_at
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE u.dni = p_login
    LIMIT 1;
  ELSE
    SELECT u.id, u.nombre, u.email, u.dni, u.password, r.codigo AS rol,
           u.activo, u.estado_cuenta, u.avatar_url, u.created_at
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_login))
    LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_usuario_perfil$$
CREATE PROCEDURE sp_usuario_perfil(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT u.id, u.nombre, u.email, u.dni, r.codigo AS rol,
         u.activo, u.estado_cuenta, u.avatar_url, u.created_at
  FROM usuarios u
  INNER JOIN roles r ON u.rol_id = r.id
  WHERE u.id = p_usuario_id;
END$$

DROP PROCEDURE IF EXISTS sp_agricultor_id_por_usuario$$
CREATE PROCEDURE sp_agricultor_id_por_usuario(IN p_usuario_id INT UNSIGNED)
BEGIN
  SELECT id FROM agricultores
  WHERE usuario_id = p_usuario_id AND activo = 1
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_usuarios_tecnicos_pendientes$$
CREATE PROCEDURE sp_usuarios_tecnicos_pendientes()
BEGIN
  SELECT u.id, u.nombre, u.email, u.dni, r.codigo AS rol,
         u.estado_cuenta, u.created_at
  FROM usuarios u
  INNER JOIN roles r ON u.rol_id = r.id
  WHERE u.rol_id = 3 AND u.estado_cuenta = 'pendiente'
  ORDER BY u.created_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_usuario_aprobar_tecnico$$
CREATE PROCEDURE sp_usuario_aprobar_tecnico(IN p_usuario_id INT UNSIGNED)
BEGIN
  UPDATE usuarios
  SET estado_cuenta = 'aprobada', activo = 1
  WHERE id = p_usuario_id AND rol_id = 3 AND estado_cuenta = 'pendiente';
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_usuario_rechazar_tecnico$$
CREATE PROCEDURE sp_usuario_rechazar_tecnico(IN p_usuario_id INT UNSIGNED)
BEGIN
  UPDATE usuarios
  SET estado_cuenta = 'rechazada', activo = 0
  WHERE id = p_usuario_id AND rol_id = 3 AND estado_cuenta = 'pendiente';
  SELECT ROW_COUNT() AS affected;
END$$

-- ------------------------------------------------------------
-- Solicitudes de aprobación (lotes / cultivos)
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_solicitud_crear$$
CREATE PROCEDURE sp_solicitud_crear(
  IN p_entidad_tipo ENUM('lote','cultivo'),
  IN p_entidad_id INT UNSIGNED,
  IN p_solicitado_por INT UNSIGNED,
  IN p_lote_destino_id INT UNSIGNED
)
BEGIN
  INSERT INTO solicitudes_aprobacion
    (entidad_tipo, entidad_id, estado, solicitado_por, lote_destino_id)
  VALUES (p_entidad_tipo, p_entidad_id, 'pendiente', p_solicitado_por, p_lote_destino_id);
  SELECT LAST_INSERT_ID() AS solicitud_id;
END$$

DROP PROCEDURE IF EXISTS sp_solicitud_aprobar$$
CREATE PROCEDURE sp_solicitud_aprobar(
  IN p_entidad_tipo ENUM('lote','cultivo'),
  IN p_entidad_id INT UNSIGNED,
  IN p_revisor_id INT UNSIGNED
)
BEGIN
  DECLARE v_sol_id INT UNSIGNED;
  DECLARE v_lote_destino INT UNSIGNED;

  SELECT id, lote_destino_id INTO v_sol_id, v_lote_destino
  FROM solicitudes_aprobacion
  WHERE entidad_tipo = p_entidad_tipo AND entidad_id = p_entidad_id
  ORDER BY id DESC LIMIT 1;

  IF v_sol_id IS NULL THEN
    SELECT 0 AS affected;
  ELSE
    UPDATE solicitudes_aprobacion
    SET estado = 'aprobado', revisado_por = p_revisor_id,
        fecha_revision = NOW(), motivo_rechazo = NULL
    WHERE id = v_sol_id AND estado = 'pendiente';

    IF p_entidad_tipo = 'lote' THEN
      UPDATE lotes SET activo = 1 WHERE id = p_entidad_id;
    ELSE
      UPDATE cultivos SET activo = 1 WHERE id = p_entidad_id;
      IF v_lote_destino IS NOT NULL THEN
        UPDATE lotes SET cultivo_id = p_entidad_id
        WHERE id = v_lote_destino AND activo = 1;
      END IF;
    END IF;
    SELECT ROW_COUNT() AS affected;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_solicitud_rechazar$$
CREATE PROCEDURE sp_solicitud_rechazar(
  IN p_entidad_tipo ENUM('lote','cultivo'),
  IN p_entidad_id INT UNSIGNED,
  IN p_revisor_id INT UNSIGNED,
  IN p_motivo VARCHAR(255)
)
BEGIN
  DECLARE v_sol_id INT UNSIGNED;

  SELECT id INTO v_sol_id
  FROM solicitudes_aprobacion
  WHERE entidad_tipo = p_entidad_tipo AND entidad_id = p_entidad_id
  ORDER BY id DESC LIMIT 1;

  IF v_sol_id IS NULL THEN
    SELECT 0 AS affected;
  ELSE
    UPDATE solicitudes_aprobacion
    SET estado = 'rechazado', revisado_por = p_revisor_id,
        fecha_revision = NOW(), motivo_rechazo = COALESCE(p_motivo, 'Solicitud rechazada')
    WHERE id = v_sol_id AND estado = 'pendiente';

    IF p_entidad_tipo = 'lote' THEN
      UPDATE lotes SET activo = 0 WHERE id = p_entidad_id;
    ELSE
      UPDATE cultivos SET activo = 0 WHERE id = p_entidad_id;
    END IF;
    SELECT ROW_COUNT() AS affected;
  END IF;
END$$

-- ------------------------------------------------------------
-- Dashboard — KPIs con alcance por agricultor (NULL = global)
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_dashboard_kpis$$
CREATE PROCEDURE sp_dashboard_kpis(IN p_agricultor_id INT UNSIGNED)
BEGIN
  IF p_agricultor_id IS NULL THEN
    SELECT (SELECT COUNT(*) FROM agricultores WHERE activo = 1) AS total_agricultores,
           (SELECT COUNT(*) FROM cultivos WHERE activo = 1) AS total_cultivos,
           (SELECT COUNT(*) FROM lotes WHERE activo = 1) AS total_lotes,
           (SELECT COUNT(*) FROM sensores s
            INNER JOIN lotes l ON s.lote_id = l.id
            WHERE s.estado = 'activo' AND s.activo = 1) AS total_sensores,
           (SELECT COUNT(*) FROM alertas al
            LEFT JOIN registros_agricolas r ON al.registro_id = r.id
            LEFT JOIN sensores s ON al.sensor_id = s.id
            LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
            WHERE al.nivel = 'critica' AND al.resuelta = 0
              AND (l.id IS NOT NULL OR al.tipo = 'sistema')) AS alertas_criticas,
           (SELECT COUNT(*) FROM registros_agricolas) AS total_registros;
  ELSE
    SELECT 1 AS total_agricultores,
           (SELECT COUNT(DISTINCT c.id) FROM cultivos c
            INNER JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
            WHERE c.activo = 1 AND l.agricultor_id = p_agricultor_id) AS total_cultivos,
           (SELECT COUNT(*) FROM lotes WHERE activo = 1 AND agricultor_id = p_agricultor_id) AS total_lotes,
           (SELECT COUNT(*) FROM sensores s
            INNER JOIN lotes l ON s.lote_id = l.id
            WHERE s.estado = 'activo' AND s.activo = 1 AND l.agricultor_id = p_agricultor_id) AS total_sensores,
           (SELECT COUNT(*) FROM alertas al
            LEFT JOIN registros_agricolas r ON al.registro_id = r.id
            LEFT JOIN sensores s ON al.sensor_id = s.id
            LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
            WHERE al.nivel = 'critica' AND al.resuelta = 0
              AND l.agricultor_id = p_agricultor_id) AS alertas_criticas,
           (SELECT COUNT(*) FROM registros_agricolas r
            INNER JOIN lotes l ON r.lote_id = l.id
            WHERE l.agricultor_id = p_agricultor_id) AS total_registros;
  END IF;
END$$

-- ------------------------------------------------------------
-- Registros y alertas
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_registro_crear$$
CREATE PROCEDURE sp_registro_crear(
  IN p_lote_id INT UNSIGNED,
  IN p_fecha_registro DATETIME,
  IN p_temperatura DECIMAL(6,2),
  IN p_humedad_suelo DECIMAL(6,2),
  IN p_humedad_aire DECIMAL(6,2),
  IN p_ph_suelo DECIMAL(4,2),
  IN p_precipitacion_mm DECIMAL(8,2),
  IN p_produccion_kg DECIMAL(12,2),
  IN p_observaciones TEXT,
  IN p_registrado_por INT UNSIGNED
)
BEGIN
  INSERT INTO registros_agricolas
    (lote_id, fecha_registro, temperatura, humedad_suelo, humedad_aire,
     ph_suelo, precipitacion_mm, produccion_kg, observaciones, registrado_por)
  VALUES
    (p_lote_id, COALESCE(p_fecha_registro, NOW()), p_temperatura, p_humedad_suelo,
     p_humedad_aire, p_ph_suelo, COALESCE(p_precipitacion_mm, 0),
     p_produccion_kg, p_observaciones, p_registrado_por);
  SELECT LAST_INSERT_ID() AS registro_id;
END$$

DROP PROCEDURE IF EXISTS sp_alerta_crear$$
CREATE PROCEDURE sp_alerta_crear(
  IN p_registro_id INT UNSIGNED,
  IN p_sensor_id INT UNSIGNED,
  IN p_tipo ENUM('humedad','temperatura','ph','pluvia','sensor','produccion','sistema'),
  IN p_nivel ENUM('info','advertencia','critica'),
  IN p_titulo VARCHAR(200),
  IN p_mensaje TEXT
)
BEGIN
  INSERT INTO alertas (registro_id, sensor_id, tipo, nivel, titulo, mensaje)
  VALUES (p_registro_id, p_sensor_id, p_tipo, COALESCE(p_nivel, 'advertencia'), p_titulo, p_mensaje);
  SELECT LAST_INSERT_ID() AS alerta_id;
END$$

DROP PROCEDURE IF EXISTS sp_sensor_actualizar_lectura$$
CREATE PROCEDURE sp_sensor_actualizar_lectura(
  IN p_sensor_id INT UNSIGNED,
  IN p_lectura DECIMAL(12,4)
)
BEGIN
  UPDATE sensores
  SET ultima_lectura = p_lectura, ultima_fecha = NOW()
  WHERE id = p_sensor_id;
  SELECT ROW_COUNT() AS affected;
END$$

-- ------------------------------------------------------------
-- Catálogos — resolver código a ID
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_catalogo_rol_id$$
CREATE PROCEDURE sp_catalogo_rol_id(IN p_codigo VARCHAR(20))
BEGIN
  SELECT id FROM roles WHERE codigo = p_codigo LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_catalogo_tipo_cultivo_id$$
CREATE PROCEDURE sp_catalogo_tipo_cultivo_id(IN p_codigo VARCHAR(30))
BEGIN
  SELECT id FROM tipos_cultivo WHERE codigo = p_codigo LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_catalogo_temporada_id$$
CREATE PROCEDURE sp_catalogo_temporada_id(IN p_codigo VARCHAR(20))
BEGIN
  SELECT id FROM temporadas_cultivo WHERE codigo = p_codigo LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_catalogo_tipo_suelo_id$$
CREATE PROCEDURE sp_catalogo_tipo_suelo_id(IN p_codigo VARCHAR(20))
BEGIN
  SELECT id FROM tipos_suelo WHERE codigo = p_codigo LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_catalogo_tipo_sensor_id$$
CREATE PROCEDURE sp_catalogo_tipo_sensor_id(IN p_codigo VARCHAR(30))
BEGIN
  SELECT id FROM tipos_sensor WHERE codigo = p_codigo LIMIT 1;
END$$

DELIMITER ;
