/**
 * Servidor principal - Agricultura Inteligente Junín
 * Arquitectura MVC | Express | JWT | MySQL
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200', credentials: true }));
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
