/**
 * Proxy Google Maps — Directions y Geocoding (clave solo en servidor)
 */
const https = require('https');

const HUANCAYO_ORIGIN = '-12.06513,-75.20486';

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });

const getApiKey = () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY no está configurada en el servidor');
  return key;
};

const formatDirections = (data) => {
  const leg = data.routes?.[0]?.legs?.[0];
  if (!leg) return null;
  return {
    origen: {
      lat: leg.start_location.lat,
      lng: leg.start_location.lng,
      direccion: leg.start_address,
    },
    destino: {
      lat: leg.end_location.lat,
      lng: leg.end_location.lng,
      direccion: leg.end_address,
    },
    distancia: leg.distance?.text,
    distancia_metros: leg.distance?.value,
    duracion: leg.duration?.text,
    duracion_segundos: leg.duration?.value,
    polyline: data.routes[0].overview_polyline?.points,
    bounds: data.routes[0].bounds,
  };
};

/** Ruta en auto desde Huancayo (Junín) hasta el punto del lote */
const getDirectionsToLote = async (lat, lng) => {
  const destination = `${lat},${lng}`;
  const key = getApiKey();
  const url =
    `https://maps.googleapis.com/maps/api/directions/json?origin=${HUANCAYO_ORIGIN}` +
    `&destination=${encodeURIComponent(destination)}&mode=driving&language=es&key=${key}`;
  const data = await fetchJson(url);
  if (data.status !== 'OK') {
    throw new Error(data.error_message || `Directions: ${data.status}`);
  }
  return {
    origen_referencia: 'Huancayo, Junín',
    ...formatDirections(data),
  };
};

const reverseGeocode = async (lat, lng) => {
  const key = getApiKey();
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${key}`;
  const data = await fetchJson(url);
  if (data.status !== 'OK' || !data.results?.length) {
    return { direccion: `${lat}, ${lng}`, place_id: null };
  }
  return {
    direccion: data.results[0].formatted_address,
    place_id: data.results[0].place_id,
  };
};

const getMapsConfig = () => ({
  apiKey: getApiKey(),
  centro: { lat: -12.06513, lng: -75.20486, etiqueta: 'Huancayo, Junín' },
  origenRuta: HUANCAYO_ORIGIN,
});

module.exports = { getDirectionsToLote, reverseGeocode, getMapsConfig, HUANCAYO_ORIGIN };
