-- ============================================================
-- SISTEMA WEB DE AGRICULTURA INTELIGENTE - REGIÓN JUNÍN
-- Base de datos MySQL — 3FN con tablas catálogo
-- ============================================================

CREATE DATABASE IF NOT EXISTS agri_junin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agri_junin;

-- ------------------------------------------------------------
-- CATÁLOGOS (3FN — valores reutilizables, sin ENUMs repetidos)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  nombre      VARCHAR(60) NOT NULL,
  descripcion VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_cultivo (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(30) NOT NULL UNIQUE,
  nombre      VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS temporadas_cultivo (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  nombre      VARCHAR(60) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS perfiles_climaticos (
  id                SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  humedad_optima_min DECIMAL(5,2) NULL,
  humedad_optima_max DECIMAL(5,2) NULL,
  temp_optima_min   DECIMAL(5,2) NULL,
  temp_optima_max   DECIMAL(5,2) NULL,
  descripcion       VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_suelo (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  nombre      VARCHAR(60) NOT NULL,
  descripcion VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_sensor (
  id                 TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo             VARCHAR(30) NOT NULL UNIQUE,
  nombre             VARCHAR(80) NOT NULL,
  unidad_medida_def  VARCHAR(20) NOT NULL DEFAULT '%',
  descripcion        VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 1. USUARIOS (identidad — rol vía FK a catálogo roles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  dni           VARCHAR(8) NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  rol_id        TINYINT UNSIGNED NOT NULL DEFAULT 2,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  estado_cuenta ENUM('aprobada','pendiente','rechazada') NOT NULL DEFAULT 'aprobada',
  avatar_url    VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_usuarios_rol (rol_id),
  INDEX idx_usuarios_activo (activo),
  INDEX idx_usuarios_dni (dni)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. AGRICULTORES (extensión 1:1 — solo dominio agrícola)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agricultores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL UNIQUE,
  telefono        VARCHAR(20) NULL,
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
-- 3. CULTIVOS (catálogo — tipo, temporada y clima vía FK)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cultivos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(120) NOT NULL,
  nombre_cientifico   VARCHAR(150) NULL,
  tipo_id             TINYINT UNSIGNED NOT NULL,
  temporada_id        TINYINT UNSIGNED NOT NULL,
  perfil_climatico_id SMALLINT UNSIGNED NULL,
  dias_crecimiento    SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  rendimiento_promedio DECIMAL(8,2) NULL COMMENT 'qq/ha',
  descripcion         TEXT NULL,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cultivos_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_cultivo(id),
  CONSTRAINT fk_cultivos_temporada FOREIGN KEY (temporada_id) REFERENCES temporadas_cultivo(id),
  CONSTRAINT fk_cultivos_perfil FOREIGN KEY (perfil_climatico_id) REFERENCES perfiles_climaticos(id) ON DELETE SET NULL,
  INDEX idx_cultivos_nombre (nombre),
  INDEX idx_cultivos_tipo (tipo_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. LOTES — TABLA CENTRAL
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
  tipo_suelo_id   TINYINT UNSIGNED NOT NULL DEFAULT 3,
  estado          ENUM('preparacion', 'siembra', 'crecimiento', 'cosecha', 'barbecho') NOT NULL DEFAULT 'preparacion',
  fecha_siembra   DATE NULL,
  fecha_cosecha_est DATE NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lotes_agricultor
    FOREIGN KEY (agricultor_id) REFERENCES agricultores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_lotes_cultivo
    FOREIGN KEY (cultivo_id) REFERENCES cultivos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_lotes_tipo_suelo
    FOREIGN KEY (tipo_suelo_id) REFERENCES tipos_suelo(id),
  INDEX idx_lotes_estado (estado),
  INDEX idx_lotes_agricultor (agricultor_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. SOLICITUDES DE APROBACIÓN
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_aprobacion (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entidad_tipo    ENUM('lote', 'cultivo') NOT NULL,
  entidad_id      INT UNSIGNED NOT NULL,
  estado          ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  solicitado_por  INT UNSIGNED NOT NULL,
  revisado_por    INT UNSIGNED NULL,
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_revision  TIMESTAMP NULL,
  motivo_rechazo  VARCHAR(255) NULL,
  lote_destino_id INT UNSIGNED NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sol_solicitante FOREIGN KEY (solicitado_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sol_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_sol_lote_destino FOREIGN KEY (lote_destino_id) REFERENCES lotes(id) ON DELETE SET NULL,
  INDEX idx_sol_estado (estado),
  INDEX idx_sol_entidad (entidad_tipo, entidad_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. SENSORES (tipo vía FK a tipos_sensor)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensores (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id         INT UNSIGNED NOT NULL,
  tipo_sensor_id  TINYINT UNSIGNED NOT NULL,
  codigo_sensor   VARCHAR(40) NOT NULL UNIQUE,
  nombre          VARCHAR(120) NOT NULL,
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
  CONSTRAINT fk_sensores_tipo
    FOREIGN KEY (tipo_sensor_id) REFERENCES tipos_sensor(id),
  INDEX idx_sensores_tipo (tipo_sensor_id),
  INDEX idx_sensores_estado (estado)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. REGISTROS AGRÍCOLAS (cultivo derivado del lote — 3FN)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_agricolas (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id           INT UNSIGNED NOT NULL,
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
  CONSTRAINT fk_registros_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_registros_fecha (fecha_registro),
  INDEX idx_registros_lote (lote_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. ALERTAS (lote derivado de registro/sensor — 3FN)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id         INT UNSIGNED NULL,
  sensor_id           INT UNSIGNED NULL,
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
  CONSTRAINT fk_alertas_registro
    FOREIGN KEY (registro_id) REFERENCES registros_agricolas(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_alertas_sensor
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_alertas_origen CHECK (
    registro_id IS NOT NULL OR sensor_id IS NOT NULL OR tipo = 'sistema'
  ),
  INDEX idx_alertas_registro (registro_id),
  INDEX idx_alertas_sensor (sensor_id),
  INDEX idx_alertas_nivel (nivel)
) ENGINE=InnoDB;
