-- ============================================================
-- DATOS DE PRUEBA - Agricultura Inteligente Junín (3FN + catálogos)
-- Contraseña para todos los usuarios demo: Admin123!
-- ============================================================

USE agri_junin;

-- Catálogos base
INSERT INTO roles (codigo, nombre, descripcion) VALUES
('administrador', 'Administrador', 'Gestión global del sistema'),
('agricultor', 'Agricultor', 'Productor con lotes y cultivos propios'),
('tecnico', 'Técnico agrícola', 'Monitoreo y registros de campo');

INSERT INTO tipos_cultivo (codigo, nombre, descripcion) VALUES
('cereal', 'Cereal', 'Granos como maíz, cebada, trigo'),
('tuberculo', 'Tubérculo', 'Papa, oca, mashua'),
('hortaliza', 'Hortaliza', 'Verduras de hoja y raíz'),
('fruta', 'Fruta', 'Frutales y berries'),
('legumbre', 'Legumbre', 'Habas, arvejas, lentejas'),
('forraje', 'Forraje', 'Pastos y cultivos para ganado'),
('otro', 'Otro', 'Cultivos no clasificados');

INSERT INTO temporadas_cultivo (codigo, nombre) VALUES
('verano', 'Verano'),
('invierno', 'Invierno'),
('todo_año', 'Todo el año');

INSERT INTO perfiles_climaticos (nombre, humedad_optima_min, humedad_optima_max, temp_optima_min, temp_optima_max, descripcion) VALUES
('Perfil Papa', 60.00, 80.00, 10.00, 22.00, 'Condiciones óptimas para papa en sierra'),
('Perfil Maíz', 50.00, 70.00, 18.00, 30.00, 'Condiciones óptimas para maíz'),
('Perfil Haba', 55.00, 75.00, 12.00, 24.00, 'Condiciones óptimas para haba'),
('Perfil Zanahoria', 55.00, 72.00, 15.00, 25.00, 'Condiciones óptimas para zanahoria'),
('Perfil Cebada', 45.00, 65.00, 8.00, 20.00, 'Condiciones óptimas para cebada');

INSERT INTO tipos_suelo (codigo, nombre, descripcion) VALUES
('arcilloso', 'Arcilloso', 'Alta retención de agua'),
('arenoso', 'Arenoso', 'Buen drenaje, baja retención'),
('franco', 'Franco', 'Balance arcilla-arena-limo'),
('limoso', 'Limoso', 'Textura fina con buen drenaje'),
('otro', 'Otro', 'Suelo no clasificado');

INSERT INTO tipos_sensor (codigo, nombre, unidad_medida_def, descripcion) VALUES
('humedad_suelo', 'Humedad de suelo', '%', 'Sensor de humedad en subsuelo'),
('temperatura', 'Temperatura ambiente', '°C', 'Sensor de temperatura del aire'),
('humedad_aire', 'Humedad relativa', '%', 'Humedad del aire'),
('ph', 'pH del suelo', 'pH', 'Medición de acidez/alcalinidad'),
('luz', 'Luminosidad', 'lux', 'Radiación solar incidente'),
('pluviometro', 'Pluviómetro', 'mm', 'Precipitación acumulada'),
('multiparametro', 'Multiparamétrico', 'varios', 'Sensor combinado de variables');

-- Usuarios (rol_id: 1=admin, 2=agricultor, 3=tecnico)
INSERT INTO usuarios (nombre, email, dni, password, rol_id, activo, estado_cuenta) VALUES
('Carlos Mendoza', 'admin@agrijunin.pe', '12345678', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 1, 1, 'aprobada'),
('María Quispe Flores', 'maria.quispe@agrijunin.pe', '45218763', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 2, 1, 'aprobada'),
('Juan Rojas Paredes', 'juan.rojas@agrijunin.pe', '41896523', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 2, 1, 'aprobada'),
('Ana Tello', 'ana.tello@agrijunin.pe', '70123456', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 3, 1, 'aprobada'),
('Pedro Huamán', 'pedro.huaman@agrijunin.pe', '70234567', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 3, 1, 'aprobada'),
('Rosa Quispe Mendoza', 'rosa.quispe@mail.pe', '40125896', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 2, 1, 'aprobada'),
('Luis Vega Torres', 'luis.vega@mail.pe', '70345678', '$2a$10$snx0Dfk44tEORqp5mxTTY.Dkp/dxZFaIZsP6KcL.a9RyMopfUNmja', 3, 0, 'pendiente');

INSERT INTO agricultores (usuario_id, telefono, direccion, distrito, hectareas_totales, fecha_registro, activo) VALUES
(2, '987654321', 'Av. Los Andes 245, Chupaca', 'Chupaca', 12.50, '2023-03-15', 1),
(3, '976543210', 'Carretera Central Km 8, Huancayo', 'Huancayo', 8.75, '2023-05-20', 1),
(6, '965432109', 'Sector Alto Pampa, Jauja', 'Jauja', 5.20, '2024-01-10', 1);

INSERT INTO cultivos (nombre, nombre_cientifico, tipo_id, temporada_id, perfil_climatico_id, dias_crecimiento, rendimiento_promedio, descripcion, activo) VALUES
('Papa', 'Solanum tuberosum', 2, 2, 1, 120, 25.00, 'Principal cultivo de la sierra central', 1),
('Maíz', 'Zea mays', 1, 1, 2, 110, 35.00, 'Cereal de alto valor nutricional', 1),
('Haba', 'Vicia faba', 5, 2, 3, 100, 18.00, 'Legumbre tradicional juninense', 1),
('Zanahoria', 'Daucus carota', 3, 3, 4, 75, 30.00, 'Hortaliza de exportación', 1),
('Cebada', 'Hordeum vulgare', 1, 2, 5, 95, 28.00, 'Cereal forrajero y maltera', 1);

INSERT INTO lotes (agricultor_id, cultivo_id, codigo_lote, nombre, ubicacion, latitud, longitud, area_hectareas, tipo_suelo_id, estado, fecha_siembra, fecha_cosecha_est, activo) VALUES
(1, 1, 'LOT-CHU-001', 'Lote Alto Pampa', 'Sector Alto Pampa, Chupaca', -12.0500000, -75.2800000, 3.50, 3, 'crecimiento', '2025-08-15', '2026-01-15', 1),
(1, 2, 'LOT-CHU-002', 'Lote Valle Verde', 'Valle Verde, Chupaca', -12.0600000, -75.2900000, 4.00, 1, 'siembra', '2025-10-01', '2026-02-01', 1),
(2, 3, 'LOT-HUA-001', 'Lote El Mirador', 'El Mirador, Huancayo', -12.0700000, -75.2100000, 2.75, 4, 'crecimiento', '2025-07-20', '2025-12-20', 1),
(2, 4, 'LOT-HUA-002', 'Lote San Pedro', 'San Pedro, Huancayo', -12.0800000, -75.2200000, 3.00, 3, 'cosecha', '2025-03-10', '2025-06-10', 1),
(3, 1, 'LOT-JAU-001', 'Lote Jauja Norte', 'Jauja Norte', -11.7800000, -75.5000000, 2.20, 2, 'crecimiento', '2025-09-01', '2026-02-01', 1);

INSERT INTO sensores (lote_id, tipo_sensor_id, codigo_sensor, nombre, unidad_medida, valor_min, valor_max, ultima_lectura, ultima_fecha, estado, bateria_pct, activo) VALUES
(1, 1, 'SEN-HUM-001', 'Sensor Humedad Suelo 1', '%', 40.00, 85.00, 68.50, '2026-05-22 08:30:00', 'activo', 87, 1),
(1, 2, 'SEN-TMP-001', 'Sensor Temperatura 1', '°C', 5.00, 30.00, 14.20, '2026-05-22 08:30:00', 'activo', 92, 1),
(1, 4, 'SEN-PH-001', 'Sensor pH Suelo', 'pH', 5.50, 7.50, 6.30, '2026-05-22 08:00:00', 'activo', 75, 1),
(2, 1, 'SEN-HUM-002', 'Sensor Humedad Suelo 2', '%', 40.00, 85.00, 45.20, '2026-05-22 08:30:00', 'activo', 80, 1),
(3, 2, 'SEN-TMP-002', 'Sensor Temperatura 2', '°C', 5.00, 30.00, 16.80, '2026-05-22 08:30:00', 'activo', 95, 1),
(3, 6, 'SEN-PLU-001', 'Pluviómetro Central', 'mm', 0.00, 200.00, 12.50, '2026-05-22 08:30:00', 'activo', 88, 1),
(4, 5, 'SEN-LUZ-001', 'Sensor Luminosidad', 'lux', 0.00, 100000.00, 45000.00, '2026-05-22 08:30:00', 'activo', 70, 1),
(5, 7, 'SEN-MUL-001', 'Sensor Multiparamétrico', 'varios', 0.00, 100.00, 72.00, '2026-05-22 08:30:00', 'mantenimiento', 45, 1);

INSERT INTO registros_agricolas (lote_id, fecha_registro, temperatura, humedad_suelo, humedad_aire, ph_suelo, precipitacion_mm, produccion_kg, observaciones, registrado_por) VALUES
(1, '2026-05-15 10:00:00', 13.50, 72.00, 65.00, 6.20, 5.00, NULL, 'Condiciones normales de crecimiento', 4),
(1, '2026-05-18 10:00:00', 14.00, 68.50, 62.00, 6.30, 0.00, NULL, 'Ligera bajada de humedad', 4),
(1, '2026-05-22 08:00:00', 14.20, 55.00, 58.00, 6.30, 0.00, NULL, 'Humedad baja - requiere riego', 4),
(2, '2026-05-20 09:00:00', 18.50, 62.00, 70.00, 6.50, 8.00, NULL, 'Siembra reciente en buen estado', 5),
(3, '2026-05-21 11:00:00', 16.80, 70.00, 68.00, 6.80, 12.50, NULL, 'Lluvia moderada beneficiosa', 4),
(4, '2026-05-10 14:00:00', 20.00, 58.00, 55.00, 6.10, 0.00, 8500.00, 'Cosecha parcial completada', 5);

INSERT INTO alertas (registro_id, sensor_id, tipo, nivel, titulo, mensaje, leida, resuelta, fecha_alerta) VALUES
(3, NULL, 'humedad', 'critica', 'Humedad crítica en Lote Alto Pampa', 'La humedad del suelo (55%) está por debajo del mínimo óptimo (60%) para papa. Se recomienda riego inmediato.', 0, 0, '2026-05-22 08:05:00'),
(3, NULL, 'temperatura', 'info', 'Temperatura estable', 'La temperatura (14.2°C) se encuentra dentro del rango óptimo para el cultivo.', 1, 1, '2026-05-22 08:05:00'),
(5, NULL, 'pluvia', 'advertencia', 'Precipitación elevada', 'Se registraron 12.5mm de lluvia. Monitorear drenaje del lote.', 0, 0, '2026-05-21 11:30:00'),
(NULL, 8, 'sensor', 'critica', 'Batería baja en sensor multiparamétrico', 'El sensor SEN-MUL-001 tiene 45% de batería. Programar mantenimiento.', 0, 0, '2026-05-22 07:00:00'),
(6, NULL, 'produccion', 'info', 'Cosecha registrada', 'Se registró producción de 8500 kg en Lote San Pedro.', 1, 1, '2026-05-10 15:00:00');

-- Cultivo y lote pendientes de aprobación (flujo agricultor → técnico/admin)
INSERT INTO cultivos (nombre, nombre_cientifico, tipo_id, temporada_id, perfil_climatico_id, dias_crecimiento, rendimiento_promedio, descripcion, activo) VALUES
('Oca', 'Oxalis tuberosa', 2, 2, 1, 130, 20.00, 'Tubérculo andino — solicitud pendiente', 0);

INSERT INTO lotes (agricultor_id, cultivo_id, codigo_lote, nombre, ubicacion, latitud, longitud, area_hectareas, tipo_suelo_id, estado, activo) VALUES
(1, 6, 'LOT-CHU-PEND', 'Lote Solicitud Pendiente', 'Chupaca — en revisión', -12.0550000, -75.2850000, 1.50, 3, 'preparacion', 0);

INSERT INTO solicitudes_aprobacion (entidad_tipo, entidad_id, estado, solicitado_por, lote_destino_id) VALUES
('cultivo', 6, 'pendiente', 2, NULL),
('lote', 6, 'pendiente', 2, NULL);
