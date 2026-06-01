/**
 * Búsqueda de plantas — Trefle.io + catálogo local AgriJunín
 * https://docs.trefle.io/
 */
require('../config/env');
const https = require('https');

const TREFLE_BASE = 'https://trefle.io/api/v1';

const CATALOGO_LOCAL = [
  { nombre: 'Papa', nombre_cientifico: 'Solanum tuberosum', tipo: 'tuberculo', familia: 'Solanaceae' },
  { nombre: 'Maíz', nombre_cientifico: 'Zea mays', tipo: 'cereal', familia: 'Poaceae' },
  { nombre: 'Haba', nombre_cientifico: 'Vicia faba', tipo: 'legumbre', familia: 'Fabaceae' },
  { nombre: 'Quinua', nombre_cientifico: 'Chenopodium quinoa', tipo: 'cereal', familia: 'Amaranthaceae' },
  { nombre: 'Zanahoria', nombre_cientifico: 'Daucus carota', tipo: 'hortaliza', familia: 'Apiaceae' },
  { nombre: 'Cebolla', nombre_cientifico: 'Allium cepa', tipo: 'hortaliza', familia: 'Amaryllidaceae' },
  { nombre: 'Tomate', nombre_cientifico: 'Solanum lycopersicum', tipo: 'hortaliza', familia: 'Solanaceae' },
  { nombre: 'Lechuga', nombre_cientifico: 'Lactuca sativa', tipo: 'hortaliza', familia: 'Asteraceae' },
  { nombre: 'Trigo', nombre_cientifico: 'Triticum aestivum', tipo: 'cereal', familia: 'Poaceae' },
  { nombre: 'Cebada', nombre_cientifico: 'Hordeum vulgare', tipo: 'cereal', familia: 'Poaceae' },
  { nombre: 'Avena', nombre_cientifico: 'Avena sativa', tipo: 'cereal', familia: 'Poaceae' },
  { nombre: 'Frijol', nombre_cientifico: 'Phaseolus vulgaris', tipo: 'legumbre', familia: 'Fabaceae' },
  { nombre: 'Yuca', nombre_cientifico: 'Manihot esculenta', tipo: 'tuberculo', familia: 'Euphorbiaceae' },
  { nombre: 'Camote', nombre_cientifico: 'Ipomoea batatas', tipo: 'tuberculo', familia: 'Convolvulaceae' },
  { nombre: 'Arroz', nombre_cientifico: 'Oryza sativa', tipo: 'cereal', familia: 'Poaceae' },
];

const getToken = () => {
  const token = (
    process.env.TREFLE_API_TOKEN ||
    process.env.TREFLE_TOKEN ||
    process.env.PERENUAL_API_KEY ||
    ''
  ).trim();
  if (!token) {
    throw new Error(
      'TREFLE_API_TOKEN no configurada. Agregue su token en backend/.env y reinicie el servidor.'
    );
  }
  return token;
};

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { family: 4, headers: { Accept: 'application/json', 'User-Agent': 'AgriJunin/1.0' } }, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 400) {
              const msg = data.error || data.message || `HTTP ${res.statusCode}`;
              return reject(new Error(msg));
            }
            resolve(data);
          } catch {
            reject(new Error('Respuesta inválida de Trefle'));
          }
        });
      })
      .on('error', () => reject(new Error('No se pudo conectar con Trefle.io')));
  });

const inferirTipo = (commonName, scientificName) => {
  const t = `${commonName || ''} ${scientificName || ''}`.toLowerCase();
  if (/(papa|potato|yuca|oca|camote|tuberculo|tubérculo|manihot|ipomoea)/.test(t)) return 'tuberculo';
  if (/(ma[ií]z|corn|trigo|cebada|avena|quinua|arroz|cereal|zea|oryza)/.test(t)) return 'cereal';
  if (/(haba|frijol|lenteja|legumb|phaseolus|vicia)/.test(t)) return 'legumbre';
  if (/(zanahoria|lechuga|tomate|cebolla|hortal|carrot|lactuca|capsicum)/.test(t)) return 'hortaliza';
  if (/(manzana|uva|frut|citrus|berry)/.test(t)) return 'fruta';
  if (/(alfalfa|forraje)/.test(t)) return 'forraje';
  return 'otro';
};

const mapTrefle = (item) => {
  const scientific = item.scientific_name || '';
  const common =
    item.common_name ||
    (scientific.includes('tuberosum') ? 'Papa' : null) ||
    item.genus ||
    scientific;
  let descripcion = '';
  if (item.family) descripcion += `Familia: ${item.family}. `;
  if (item.genus) descripcion += `Género: ${item.genus}. `;
  if (item.year) descripcion += `Descrita: ${item.year}.`;

  return {
    perenual_id: item.id,
    nombre: common,
    nombre_cientifico: scientific,
    tipo_sugerido: inferirTipo(common, scientific),
    temporada_sugerida: 'todo_año',
    familia: item.family || null,
    ciclo: null,
    imagen_url: item.image_url || null,
    descripcion_sugerida: descripcion.trim() || null,
  };
};

const normalizar = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buscarLocal = (q) => {
  const term = normalizar(q);
  return CATALOGO_LOCAL.filter(
    (c) =>
      normalizar(c.nombre).includes(term) ||
      normalizar(c.nombre_cientifico).includes(term)
  ).map((c, i) => ({
    perenual_id: `local-${i}`,
    nombre: c.nombre,
    nombre_cientifico: c.nombre_cientifico,
    tipo_sugerido: c.tipo,
    temporada_sugerida: 'todo_año',
    familia: c.familia,
    ciclo: null,
    imagen_url: null,
    descripcion_sugerida: `Catálogo AgriJunín — ${c.familia}`,
  }));
};

const SINONIMOS_BUSQUEDA = {
  papa: ['potato', 'solanum tuberosum'],
  maiz: ['corn', 'zea mays'],
  'maíz': ['corn', 'zea mays'],
  haba: ['fava', 'vicia faba'],
  tomate: ['tomato', 'solanum lycopersicum'],
};

const buscarTrefleUna = async (term, token) => {
  const params = new URLSearchParams({ token, q: term });
  let data = await fetchJson(`${TREFLE_BASE}/plants/search?${params}`);
  let items = data.data || [];
  if (!items.length) {
    data = await fetchJson(`${TREFLE_BASE}/species/search?${params}`);
    items = data.data || [];
  }
  return items;
};

const buscarTrefle = async (q, limit) => {
  const token = getToken();
  const terminos = [q, ...(SINONIMOS_BUSQUEDA[q.toLowerCase()] || [])];
  const items = [];
  for (const term of terminos) {
    if (items.length >= limit) break;
    const batch = await buscarTrefleUna(term, token);
    items.push(...batch);
  }
  return items.slice(0, limit).map(mapTrefle);
};

const dedupe = (lista) => {
  const seen = new Set();
  return lista.filter((item) => {
    const key = (item.nombre_cientifico || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buscarEspecies = async (query, perPage = 8) => {
  const q = String(query || '').trim();
  if (q.length < 2) {
    throw new Error('Ingrese al menos 2 caracteres para buscar');
  }

  const limit = Math.min(perPage, 12);
  const local = buscarLocal(q);
  let trefle = [];
  try {
    trefle = await buscarTrefle(q, limit);
  } catch (e) {
    if (!local.length) throw e;
  }

  const merged = dedupe([...local, ...trefle]).slice(0, limit);
  if (!merged.length) {
    throw new Error(`No se encontraron plantas para "${q}". Pruebe: papa, maíz, haba, tomate.`);
  }

  return {
    query: q,
    total: merged.length,
    resultados: merged,
    fuente: trefle.length ? 'Trefle.io + catálogo AgriJunín' : 'catálogo AgriJunín',
  };
};

module.exports = { buscarEspecies };
