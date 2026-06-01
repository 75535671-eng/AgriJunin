/**
 * Servidor principal - Agricultura Inteligente Junín
 * Estructura nueva en /src manteniendo el comportamiento.
 */
require('../config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./repository/database.repository');
const apiRoutes = require('./apis');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Demasiadas solicitudes' },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API Agricultura Inteligente Junín operativa',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

async function start() {
  try {
    if (process.env.TREFLE_API_TOKEN?.trim() || process.env.PERENUAL_API_KEY?.trim()) {
      console.log('✓ Trefle API — búsqueda de nombres científicos activa');
    } else {
      console.warn('⚠ TREFLE_API_TOKEN no definida en backend/.env');
    }
    await testConnection();
    console.log('✓ Conexión MySQL establecida');
    app.listen(PORT, () => {
      console.log(`✓ Servidor en http://localhost:${PORT}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('✗ Error al iniciar:', err.message);
    console.error('  Verifique MySQL y el archivo .env');
    process.exit(1);
  }
}

start();
