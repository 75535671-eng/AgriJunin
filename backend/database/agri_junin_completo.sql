-- ============================================================
-- AgriJunín — SCRIPT COMPLETO (estructura + datos demo)
-- MySQL 8+ / MariaDB 10.4+
--
-- Uso:
--   mysql -u root -p < agri_junin_completo.sql
--   O en MySQL Workbench: ejecutar todo el archivo
--
-- Contraseña demo de todos los usuarios: Admin123!
-- (opcional: node database/fix-passwords.js)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS agri_junin;

-- ============================================================
-- SISTEMA WEB DE AGRICULTURA INTELIGENTE - REGIÓN JUNÍN
-- Base de datos MySQL con integridad referencial
-- ============================================================

CREATE DATABASE IF NOT EXISTS agri_junin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agri_junin;

-- ------------------------------------------------------------
-- 1. USUARIOS (autenticación y roles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  dni           VARCHAR(8) NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  rol           ENUM('administrador', 'agricultor', 'tecnico') NOT NULL DEFAULT 'agricultor',
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  estado_cuenta ENUM('aprobada','pendiente','rechazada') NOT NULL DEFAULT 'aprobada',
  avatar_url    VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_activo (activo),
  INDEX idx_usuarios_dni (dni)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. AGRICULTORES (1:1 con usuarios: un usuario = una sola ficha)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agricultores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NULL UNIQUE,
  dni             VARCHAR(15) NOT NULL UNIQUE,
  nombres         VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  telefono        VARCHAR(20) NULL,
  email_contacto  VARCHAR(180) NULL,
  direccion       TEXT NULL,
  distrito        VARCHAR(80) NOT NULL DEFAULT 'Junín',
  provincia       VARCHAR(80) NOT NULL DEFAULT 'Junín',
  departamento    VARCHAR(80) NOT NULL DEFAULT 'Junín',
  hectareas_totales DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha_registro  DATE NOT NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  notas           TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_agricultores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_agricultores_distrito (distrito),
  INDEX idx_agricultores_activo (activo)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. CULTIVOS (catálogo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cultivos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120) NOT NULL,
  nombre_cientifico VARCHAR(150) NULL,
  tipo              ENUM('cereal', 'tuberculo', 'hortaliza', 'fruta', 'legumbre', 'forraje', 'otro') NOT NULL,
  temporada         ENUM('verano', 'invierno', 'todo_año') NOT NULL DEFAULT 'todo_año',
  dias_crecimiento  SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  rendimiento_promedio DECIMAL(8,2) NULL COMMENT 'qq/ha',
  humedad_optima_min DECIMAL(5,2) NULL,
  humedad_optima_max DECIMAL(5,2) NULL,
  temp_optima_min   DECIMAL(5,2) NULL,
  temp_optima_max   DECIMAL(5,2) NULL,
  descripcion       TEXT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  estado_aprobacion ENUM('aprobado','pendiente','rechazado') NOT NULL DEFAULT 'aprobado',
  solicitado_por    INT UNSIGNED NULL,
  revisado_por      INT UNSIGNED NULL,
  fecha_revision    TIMESTAMP NULL,
  motivo_rechazo    VARCHAR(255) NULL,
  lote_solicitud_id INT UNSIGNED NULL COMMENT 'Lote donde el agricultor usará este cultivo (solicitud)',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cultivos_tipo (tipo),
  INDEX idx_cultivos_nombre (nombre),
  INDEX idx_cultivos_aprobacion (estado_aprobacion),
  CONSTRAINT fk_cultivos_solicitante FOREIGN KEY (solicitado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_cultivos_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. LOTES — TABLA CENTRAL DE RELACIÓN
--    Agricultor (dueño) + Cultivo (qué siembra) = Lote (parcela)
--    Sensores → lote_id | Registros → lote_id + cultivo_id | Alertas → registro → lote
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lotes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agricultor_id   INT UNSIGNED NOT NULL,
  cultivo_id      INT UNSIGNED NULL,
  codigo_lote     VARCHAR(30) NOT NULL UNIQUE,
  nombre          VARCHAR(120) NOT NULL,
  ubicacion       VARCHAR(255) NULL,
  latitud         DECIMAL(10,7) NULL,
  longitud        DECIMAL(10,7) NULL,
  area_hectareas  DECIMAL(10,2) NOT NULL,
  tipo_suelo      ENUM('arcilloso', 'arenoso', 'franco', 'limoso', 'otro') NOT NULL DEFAULT 'franco',
  estado          ENUM('preparacion', 'siembra', 'crecimiento', 'cosecha', 'barbecho') NOT NULL DEFAULT 'preparacion',
  fecha_siembra   DATE NULL,
  fecha_cosecha_est DATE NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  estado_aprobacion ENUM('aprobado','pendiente','rechazado') NOT NULL DEFAULT 'aprobado',
  solicitado_por    INT UNSIGNED NULL,
  revisado_por      INT UNSIGNED NULL,
  fecha_revision    TIMESTAMP NULL,
  motivo_rechazo    VARCHAR(255) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lotes_agricultor
    FOREIGN KEY (agricultor_id) REFERENCES agricultores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_lotes_cultivo
    FOREIGN KEY (cultivo_id) REFERENCES cultivos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_lotes_solicitante FOREIGN KEY (solicitado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_lotes_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_lotes_estado (estado),
  INDEX idx_lotes_agricultor (agricultor_id),
  INDEX idx_lotes_aprobacion (estado_aprobacion)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. SENSORES (1:N desde lotes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id         INT UNSIGNED NOT NULL,
  codigo_sensor   VARCHAR(40) NOT NULL UNIQUE,
  nombre          VARCHAR(120) NOT NULL,
  tipo            ENUM('humedad_suelo', 'temperatura', 'humedad_aire', 'ph', 'luz', 'pluviometro', 'multiparametro') NOT NULL,
  unidad_medida   VARCHAR(20) NOT NULL,
  valor_min       DECIMAL(10,2) NULL,
  valor_max       DECIMAL(10,2) NULL,
  ultima_lectura  DECIMAL(12,4) NULL,
  ultima_fecha    DATETIME NULL,
  estado          ENUM('activo', 'inactivo', 'mantenimiento', 'falla') NOT NULL DEFAULT 'activo',
  bateria_pct     TINYINT UNSIGNED NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sensores_lote
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_sensores_tipo (tipo),
  INDEX idx_sensores_estado (estado)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. REGISTROS AGRÍCOLAS (1:N desde lotes, N:1 cultivos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_agricolas (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id           INT UNSIGNED NOT NULL,
  cultivo_id        INT UNSIGNED NOT NULL,
  fecha_registro    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  temperatura       DECIMAL(6,2) NULL,
  humedad_suelo     DECIMAL(6,2) NULL,
  humedad_aire      DECIMAL(6,2) NULL,
  ph_suelo          DECIMAL(4,2) NULL,
  precipitacion_mm  DECIMAL(8,2) NULL DEFAULT 0,
  produccion_kg     DECIMAL(12,2) NULL,
  observaciones     TEXT NULL,
  registrado_por    INT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_registros_lote
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_registros_cultivo
    FOREIGN KEY (cultivo_id) REFERENCES cultivos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_registros_fecha (fecha_registro),
  INDEX idx_registros_lote (lote_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. ALERTAS (origen: registro agrícola, sensor o lote; tipo sistema opcional)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id             INT UNSIGNED NULL COMMENT 'Contexto del campo (directo o derivado)',
  registro_id         INT UNSIGNED NULL COMMENT 'Lecturas de clima / registro agrícola',
  sensor_id           INT UNSIGNED NULL COMMENT 'Hardware IoT (batería, falla, etc.)',
  tipo                ENUM('humedad', 'temperatura', 'ph', 'pluvia', 'sensor', 'produccion', 'sistema') NOT NULL,
  nivel               ENUM('info', 'advertencia', 'critica') NOT NULL DEFAULT 'advertencia',
  titulo              VARCHAR(200) NOT NULL,
  mensaje             TEXT NOT NULL,
  leida               TINYINT(1) NOT NULL DEFAULT 0,
  resuelta            TINYINT(1) NOT NULL DEFAULT 0,
  fecha_alerta        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion    DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alertas_lote
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_alertas_registro
    FOREIGN KEY (registro_id) REFERENCES registros_agricolas(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_alertas_sensor
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_alertas_origen CHECK (
    registro_id IS NOT NULL
    OR sensor_id IS NOT NULL
    OR lote_id IS NOT NULL
    OR tipo = 'sistema'
  ),
  INDEX idx_alertas_lote (lote_id),
  INDEX idx_alertas_registro (registro_id),
  INDEX idx_alertas_sensor (sensor_id),
  INDEX idx_alertas_nivel (nivel),
  INDEX idx_alertas_leida (leida),
  INDEX idx_alertas_fecha (fecha_alerta)
) ENGINE=InnoDB;

-- FK diferida: cultivos.lote_solicitud_id → lotes (tablas ya creadas)
ALTER TABLE cultivos
  ADD CONSTRAINT fk_cultivos_lote_solicitud
  FOREIGN KEY (lote_solicitud_id) REFERENCES lotes(id) ON DELETE SET NULL;


-- ============================================================
-- DATOS DE PRUEBA - Agricultura Inteligente Junín
-- Contraseña para todos los usuarios demo: Admin123!
-- Hash bcrypt válido (también aplicable con fix-passwords.js)
-- ============================================================

USE agri_junin;

-- Contraseña: Admin123!
INSERT INTO usuarios (nombre, email, dni, password, rol, activo, estado_cuenta) VALUES
('Carlos Mendoza', 'admin@agrijunin.pe', '12345678', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 'administrador', 1, 'aprobada'),
('María Quispe', 'maria.quispe@agrijunin.pe', '45218763', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 'agricultor', 1, 'aprobada'),
('Juan Rojas', 'juan.rojas@agrijunin.pe', '41896523', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 'agricultor', 1, 'aprobada'),
('Ana Tello', 'ana.tello@agrijunin.pe', '70123456', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 'tecnico', 1, 'aprobada'),
('Pedro Huamán', 'pedro.huaman@agrijunin.pe', '70234567', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 'tecnico', 1, 'aprobada');

INSERT INTO agricultores (usuario_id, dni, nombres, apellidos, telefono, email_contacto, direccion, distrito, hectareas_totales, fecha_registro, activo) VALUES
(2, '45218763', 'María', 'Quispe Flores', '987654321', 'maria.quispe@agrijunin.pe', 'Av. Los Andes 245, Chupaca', 'Chupaca', 12.50, '2023-03-15', 1),
(3, '41896523', 'Juan', 'Rojas Paredes', '976543210', 'juan.rojas@agrijunin.pe', 'Carretera Central Km 8, Huancayo', 'Huancayo', 8.75, '2023-05-20', 1),
(NULL, '40125896', 'Rosa', 'Quispe Mendoza', '965432109', 'rosa.quispe@mail.pe', 'Sector Alto Pampa, Jauja', 'Jauja', 5.20, '2024-01-10', 1);

INSERT INTO cultivos (nombre, nombre_cientifico, tipo, temporada, dias_crecimiento, rendimiento_promedio, humedad_optima_min, humedad_optima_max, temp_optima_min, temp_optima_max, descripcion, activo, estado_aprobacion) VALUES
('Papa', 'Solanum tuberosum', 'tuberculo', 'invierno', 120, 25.00, 60.00, 80.00, 10.00, 22.00, 'Principal cultivo de la sierra central', 1, 'aprobado'),
('Maíz', 'Zea mays', 'cereal', 'verano', 110, 35.00, 50.00, 70.00, 18.00, 30.00, 'Cereal de alto valor nutricional', 1, 'aprobado'),
('Haba', 'Vicia faba', 'legumbre', 'invierno', 100, 18.00, 55.00, 75.00, 12.00, 24.00, 'Legumbre tradicional juninense', 1, 'aprobado'),
('Zanahoria', 'Daucus carota', 'hortaliza', 'todo_año', 75, 30.00, 55.00, 72.00, 15.00, 25.00, 'Hortaliza de exportación', 1, 'aprobado'),
('Cebada', 'Hordeum vulgare', 'cereal', 'invierno', 95, 28.00, 45.00, 65.00, 8.00, 20.00, 'Cereal forrajero y maltera', 1, 'aprobado');

INSERT INTO lotes (agricultor_id, cultivo_id, codigo_lote, nombre, ubicacion, latitud, longitud, area_hectareas, tipo_suelo, estado, fecha_siembra, fecha_cosecha_est, activo, estado_aprobacion) VALUES
(1, 1, 'LOT-CHU-001', 'Lote Alto Pampa', 'Sector Alto Pampa, Chupaca', -12.0500000, -75.2800000, 3.50, 'franco', 'crecimiento', '2025-08-15', '2026-01-15', 1, 'aprobado'),
(1, 2, 'LOT-CHU-002', 'Lote Valle Verde', 'Valle Verde, Chupaca', -12.0600000, -75.2900000, 4.00, 'arcilloso', 'siembra', '2025-10-01', '2026-02-01', 1, 'aprobado'),
(2, 3, 'LOT-HUA-001', 'Lote El Mirador', 'El Mirador, Huancayo', -12.0700000, -75.2100000, 2.75, 'limoso', 'crecimiento', '2025-07-20', '2025-12-20', 1, 'aprobado'),
(2, 4, 'LOT-HUA-002', 'Lote San Pedro', 'San Pedro, Huancayo', -12.0800000, -75.2200000, 3.00, 'franco', 'cosecha', '2025-03-10', '2025-06-10', 1, 'aprobado'),
(3, 1, 'LOT-JAU-001', 'Lote Jauja Norte', 'Jauja Norte', -11.7800000, -75.5000000, 2.20, 'arenoso', 'crecimiento', '2025-09-01', '2026-02-01', 1, 'aprobado');

INSERT INTO sensores (lote_id, codigo_sensor, nombre, tipo, unidad_medida, valor_min, valor_max, ultima_lectura, ultima_fecha, estado, bateria_pct, activo) VALUES
(1, 'SEN-HUM-001', 'Sensor Humedad Suelo 1', 'humedad_suelo', '%', 40.00, 85.00, 68.50, '2026-05-22 08:30:00', 'activo', 87, 1),
(1, 'SEN-TMP-001', 'Sensor Temperatura 1', 'temperatura', '°C', 5.00, 30.00, 14.20, '2026-05-22 08:30:00', 'activo', 92, 1),
(1, 'SEN-PH-001', 'Sensor pH Suelo', 'ph', 'pH', 5.50, 7.50, 6.30, '2026-05-22 08:00:00', 'activo', 75, 1),
(2, 'SEN-HUM-002', 'Sensor Humedad Suelo 2', 'humedad_suelo', '%', 40.00, 85.00, 45.20, '2026-05-22 08:30:00', 'activo', 80, 1),
(3, 'SEN-TMP-002', 'Sensor Temperatura 2', 'temperatura', '°C', 5.00, 30.00, 16.80, '2026-05-22 08:30:00', 'activo', 95, 1),
(3, 'SEN-PLU-001', 'Pluviómetro Central', 'pluviometro', 'mm', 0.00, 200.00, 12.50, '2026-05-22 08:30:00', 'activo', 88, 1),
(4, 'SEN-LUZ-001', 'Sensor Luminosidad', 'luz', 'lux', 0.00, 100000.00, 45000.00, '2026-05-22 08:30:00', 'activo', 70, 1),
(5, 'SEN-MUL-001', 'Sensor Multiparamétrico', 'multiparametro', 'varios', 0.00, 100.00, 72.00, '2026-05-22 08:30:00', 'mantenimiento', 45, 1);

INSERT INTO registros_agricolas (lote_id, cultivo_id, fecha_registro, temperatura, humedad_suelo, humedad_aire, ph_suelo, precipitacion_mm, produccion_kg, observaciones, registrado_por) VALUES
(1, 1, '2026-05-15 10:00:00', 13.50, 72.00, 65.00, 6.20, 5.00, NULL, 'Condiciones normales de crecimiento', 4),
(1, 1, '2026-05-18 10:00:00', 14.00, 68.50, 62.00, 6.30, 0.00, NULL, 'Ligera bajada de humedad', 4),
(1, 1, '2026-05-22 08:00:00', 14.20, 55.00, 58.00, 6.30, 0.00, NULL, 'Humedad baja - requiere riego', 4),
(2, 2, '2026-05-20 09:00:00', 18.50, 62.00, 70.00, 6.50, 8.00, NULL, 'Siembra reciente en buen estado', 5),
(3, 3, '2026-05-21 11:00:00', 16.80, 70.00, 68.00, 6.80, 12.50, NULL, 'Lluvia moderada beneficiosa', 4),
(4, 4, '2026-05-10 14:00:00', 20.00, 58.00, 55.00, 6.10, 0.00, 8500.00, 'Cosecha parcial completada', 5);

INSERT INTO alertas (lote_id, registro_id, sensor_id, tipo, nivel, titulo, mensaje, leida, resuelta, fecha_alerta) VALUES
(1, 3, NULL, 'humedad', 'critica', 'Humedad crítica en Lote Alto Pampa', 'La humedad del suelo (55%) está por debajo del mínimo óptimo (60%) para papa. Se recomienda riego inmediato.', 0, 0, '2026-05-22 08:05:00'),
(1, 3, NULL, 'temperatura', 'info', 'Temperatura estable', 'La temperatura (14.2°C) se encuentra dentro del rango óptimo para el cultivo.', 1, 1, '2026-05-22 08:05:00'),
(3, 5, NULL, 'pluvia', 'advertencia', 'Precipitación elevada', 'Se registraron 12.5mm de lluvia. Monitorear drenaje del lote.', 0, 0, '2026-05-21 11:30:00'),
(5, NULL, 8, 'sensor', 'critica', 'Batería baja en sensor multiparamétrico', 'El sensor SEN-MUL-001 tiene 45% de batería. Programar mantenimiento.', 0, 0, '2026-05-22 07:00:00'),
(4, 6, NULL, 'produccion', 'info', 'Cosecha registrada', 'Se registró producción de 8500 kg en Lote San Pedro.', 1, 1, '2026-05-10 15:00:00');

SET FOREIGN_KEY_CHECKS = 1;
