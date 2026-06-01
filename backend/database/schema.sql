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
