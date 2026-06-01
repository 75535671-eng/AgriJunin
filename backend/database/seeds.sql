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
