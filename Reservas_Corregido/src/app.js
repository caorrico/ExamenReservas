// Carga las variables de entorno desde .env
require('dotenv').config();

// Importa los módulos necesarios
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Crea una instancia de Express
const app = express();

// Middleware de seguridad - Headers HTTP seguros
app.use(helmet());

// Middleware para parsear cuerpos en formato JSON (con límite de tamaño)
app.use(express.json({ limit: '10kb' }));

// Sanitización contra inyección NoSQL
app.use(mongoSanitize());

// Rate limiting general para todas las rutas API
app.use('/api/', apiLimiter);

// Deshabilitar header X-Powered-By
app.disable('x-powered-by');

// Configuración de Mongoose
mongoose.set('strictQuery', false);

// Conexión a la base de datos MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB exitosamente');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

// Rutas para autenticación y reservas/turnos
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservas', require('./routes/reserva'));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  // Log del error (en producción usar Winston o similar)
  console.error('❌ Error no manejado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Respuesta al cliente
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

// Exporta la app configurada
module.exports = app;
