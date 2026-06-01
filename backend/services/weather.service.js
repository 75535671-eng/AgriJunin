/**
 * Integración clima real — Open-Meteo API (Huancayo, Junín)
 * Fuente: https://open-meteo.com/ — CC BY 4.0
 */
const https = require('https');
const { pool } = require('../config/database');

/** GET JSON vía https nativo (estable en Windows) */
const fetchJson = (url, retries = 2) =>
  new Promise((resolve, reject) => {
    const attempt = (left) => {
      const req = https.get(
        url,
        {
          family: 4,
          headers: { Accept: 'application/json', 'User-Agent': 'AgriJunin/1.0' },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            res.resume();
            return;
          }
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      req.setTimeout(20000, () => {
        req.destroy();
        if (left > 0) setTimeout(() => attempt(left - 1), 500);
        else reject(new Error('Timeout al consultar Open-Meteo'));
      });
      req.on('error', (err) => {
        if (left > 0) setTimeout(() => attempt(left - 1), 500);
        else reject(err);
      });
    };
    attempt(retries);
  });

const HUANCAYO = {
  ciudad: 'Huancayo',
  region: 'Junín',
  pais: 'Perú',
  latitud: -12.06513,
  longitud: -75.20486,
  elevacion_m: 3263,
  timezone: 'America/Lima',
};

const WEATHER_CODES = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia fuerte',
  71: 'Nieve ligera',
  80: 'Chubascos ligeros',
  95: 'Tormenta',
};

const buildForecastUrl = () => {
  const params = new URLSearchParams({
    latitude: String(HUANCAYO.latitud),
    longitude: String(HUANCAYO.longitud),
    timezone: HUANCAYO.timezone,
    forecast_days: '7',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'apparent_temperature',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'soil_moisture_0_to_1cm',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'weather_code',
    ].join(','),
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
};

const fetchClimaHuancayo = async () => {
  const raw = await fetchJson(buildForecastUrl());
  return parseOpenMeteo(raw);
};

const parseOpenMeteo = (raw) => {

  const current = raw.current;
  const hourly = raw.hourly;
  const daily = raw.daily;

  const pronosticoHorario = hourly.time.slice(0, 24).map((t, i) => ({
    hora: t,
    temperatura: hourly.temperature_2m[i],
    humedad: hourly.relative_humidity_2m[i],
    precipitacion: hourly.precipitation[i],
    humedad_suelo: hourly.soil_moisture_0_to_1cm?.[i] ?? null,
  }));

  const pronosticoDiario = daily.time.map((fecha, i) => ({
    fecha,
    temp_max: daily.temperature_2m_max[i],
    temp_min: daily.temperature_2m_min[i],
    precipitacion_mm: daily.precipitation_sum[i],
    descripcion: WEATHER_CODES[daily.weather_code[i]] || 'Variable',
    codigo: daily.weather_code[i],
  }));

  return {
    ubicacion: { ...HUANCAYO, actualizado: current.time },
    actual: {
      temperatura: current.temperature_2m,
      sensacion_termica: current.apparent_temperature,
      humedad: current.relative_humidity_2m,
      precipitacion: current.precipitation,
      viento_kmh: current.wind_speed_10m,
      codigo_clima: current.weather_code,
      descripcion: WEATHER_CODES[current.weather_code] || 'Variable',
      humedad_suelo_estimada: hourly.soil_moisture_0_to_1cm?.[0] ?? null,
    },
    pronosticoHorario,
    pronosticoDiario,
    fuente: 'Open-Meteo',
    licencia: 'CC BY 4.0',
  };
};

/** Sincroniza un lote con datos de clima ya obtenidos */
const sincronizarLoteConClima = async (userId, lote, clima) => {
  const { actual } = clima;
  const cultivoId = lote.cultivo_id || 1;
  const humedadSuelo = actual.humedad_suelo_estimada
    ? Math.round(actual.humedad_suelo_estimada * 10000) / 100
    : null;

  const [regResult] = await pool.query(
    `INSERT INTO registros_agricolas
     (lote_id, cultivo_id, fecha_registro, temperatura, humedad_suelo, humedad_aire,
      precipitacion_mm, observaciones, registrado_por)
     VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
    [
      lote.id,
      cultivoId,
      actual.temperatura,
      humedadSuelo,
      actual.humedad,
      actual.precipitacion,
      `Sincronización automática — Clima real Open-Meteo (${HUANCAYO.ciudad}, ${HUANCAYO.region}). ${actual.descripcion}.`,
      userId || null,
    ]
  );
  const registroId = regResult.insertId;

  const [sensores] = await pool.query(
    `SELECT * FROM sensores WHERE lote_id = ? AND activo = 1`,
    [lote.id]
  );

  const updates = [];
  const alertasGeneradas = [];
  for (const sensor of sensores) {
    let lectura = null;
    if (sensor.tipo === 'temperatura') lectura = actual.temperatura;
    else if (sensor.tipo === 'humedad_aire') lectura = actual.humedad;
    else if (sensor.tipo === 'humedad_suelo' && humedadSuelo != null) lectura = humedadSuelo;
    else if (sensor.tipo === 'pluviometro') lectura = actual.precipitacion;
    else if (sensor.tipo === 'multiparametro') lectura = actual.humedad;

    if (lectura != null) {
      await pool.query(
        `UPDATE sensores SET ultima_lectura = ?, ultima_fecha = NOW() WHERE id = ?`,
        [lectura, sensor.id]
      );
      updates.push({ sensor_id: sensor.id, codigo: sensor.codigo_sensor, lectura });
    }

    if (sensor.bateria_pct != null && sensor.bateria_pct < 50) {
      const [a] = await pool.query(
        `INSERT INTO alertas (lote_id, sensor_id, tipo, nivel, titulo, mensaje)
         VALUES (?, ?, 'sensor', 'critica', ?, ?)`,
        [
          lote.id,
          sensor.id,
          `Batería baja — ${sensor.nombre}`,
          `El sensor ${sensor.codigo_sensor} tiene ${sensor.bateria_pct}% de batería. Programar mantenimiento.`,
        ]
      );
      alertasGeneradas.push({ id: a.insertId, tipo: 'sensor', nivel: 'critica' });
    }
  }

  const [cultivoRows] = await pool.query('SELECT * FROM cultivos WHERE id = ?', [cultivoId]);
  const cultivo = cultivoRows[0];

  if (cultivo) {
    if (
      cultivo.humedad_optima_min != null &&
      humedadSuelo != null &&
      humedadSuelo < cultivo.humedad_optima_min
    ) {
      const [a] = await pool.query(
        `INSERT INTO alertas (lote_id, registro_id, tipo, nivel, titulo, mensaje)
         VALUES (?, ?, 'humedad', 'critica', ?, ?)`,
        [
          lote.id,
          registroId,
          `Humedad baja en ${lote.nombre} (clima Huancayo)`,
          `Open-Meteo reporta humedad de suelo ${humedadSuelo}% bajo el mínimo óptimo (${cultivo.humedad_optima_min}%) para ${cultivo.nombre}.`,
        ]
      );
      alertasGeneradas.push({ id: a.insertId, tipo: 'humedad', nivel: 'critica' });
    }

    if (
      cultivo.temp_optima_max != null &&
      actual.temperatura > cultivo.temp_optima_max
    ) {
      const [a] = await pool.query(
        `INSERT INTO alertas (lote_id, registro_id, tipo, nivel, titulo, mensaje)
         VALUES (?, ?, 'temperatura', 'advertencia', ?, ?)`,
        [
          lote.id,
          registroId,
          `Temperatura elevada — ${lote.nombre}`,
          `Clima Huancayo: ${actual.temperatura}°C supera el máximo óptimo (${cultivo.temp_optima_max}°C) para ${cultivo.nombre}.`,
        ]
      );
      alertasGeneradas.push({ id: a.insertId, tipo: 'temperatura', nivel: 'advertencia' });
    }

    if (actual.precipitacion > 5) {
      const [a] = await pool.query(
        `INSERT INTO alertas (lote_id, registro_id, tipo, nivel, titulo, mensaje)
         VALUES (?, ?, 'pluvia', 'info', ?, ?)`,
        [
          lote.id,
          registroId,
          `Precipitación en Huancayo`,
          `Se detectó precipitación de ${actual.precipitacion} mm en la zona de ${lote.nombre}.`,
        ]
      );
      alertasGeneradas.push({ id: a.insertId, tipo: 'pluvia', nivel: 'info' });
    }
  }

  return {
    lote_id: lote.id,
    lote_nombre: lote.nombre,
    registro_id: registroId,
    sensores_actualizados: updates.length,
    sensores: updates,
    alertas_generadas: alertasGeneradas.length,
    alertas: alertasGeneradas,
  };
};

/** Sincroniza clima real → un lote (registros, sensores y alertas) */
const sincronizarClima = async (userId, loteId = null, scope = null) => {
  const clima = await fetchClimaHuancayo();

  let lote;
  if (loteId) {
    let sql = 'SELECT l.*, l.cultivo_id FROM lotes l WHERE l.id = ? AND l.activo = 1';
    const params = [loteId];
    if (scope?.rol === 'agricultor' && scope.agricultorId) {
      sql += ' AND l.agricultor_id = ?';
      params.push(scope.agricultorId);
    }
    const [rows] = await pool.query(sql, params);
    lote = rows[0];
  } else if (scope?.rol === 'agricultor' && scope.agricultorId) {
    const [rows] = await pool.query(
      `SELECT l.*, l.cultivo_id FROM lotes l
       WHERE l.agricultor_id = ? AND l.activo = 1
       ORDER BY l.id ASC LIMIT 1`,
      [scope.agricultorId]
    );
    lote = rows[0];
  } else {
    const [rows] = await pool.query(
      `SELECT l.*, l.cultivo_id FROM lotes l
       WHERE l.activo = 1
       ORDER BY l.codigo_lote LIKE 'LOT-HUA%' DESC, l.id ASC LIMIT 1`
    );
    lote = rows[0];
  }

  if (!lote) {
    throw new Error(
      scope?.rol === 'agricultor'
        ? 'No tiene lotes activos para sincronizar el clima'
        : 'No hay lotes activos para sincronizar clima'
    );
  }

  const sincronizacion = await sincronizarLoteConClima(userId, lote, clima);
  return { clima, sincronizacion };
};

/** Sincroniza clima en todos los lotes activos (administrador / técnico) */
const sincronizarClimaTodos = async (userId) => {
  const clima = await fetchClimaHuancayo();
  const [lotes] = await pool.query(
    `SELECT l.*, l.cultivo_id FROM lotes l
     WHERE l.activo = 1
     ORDER BY l.id ASC`
  );

  if (!lotes.length) {
    throw new Error('No hay lotes activos para sincronizar clima');
  }

  const detalle = [];
  let totalSensores = 0;
  let totalAlertas = 0;

  for (const lote of lotes) {
    const sync = await sincronizarLoteConClima(userId, lote, clima);
    totalSensores += sync.sensores_actualizados;
    totalAlertas += sync.alertas_generadas;
    detalle.push(sync);
  }

  return {
    clima,
    sincronizacion: {
      todos_lotes: true,
      lotes_procesados: detalle.length,
      total_sensores_actualizados: totalSensores,
      total_alertas_generadas: totalAlertas,
      lotes: detalle,
    },
  };
};

module.exports = { fetchClimaHuancayo, sincronizarClima, sincronizarClimaTodos, HUANCAYO };
