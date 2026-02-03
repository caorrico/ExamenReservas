const rateLimit = require('express-rate-limit');

// Rate limiter estricto para rutas de autenticación
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: 'Demasiados intentos de autenticación desde esta IP. Por favor, intente más tarde.'
  },
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  // Identificar por IP
  keyGenerator: (req) => {
    return req.ip;
  },
  // Handler personalizado cuando se excede el límite
  handler: (req, res) => {
    console.log(`⚠️  Rate limit excedido - IP: ${req.ip}, Ruta: ${req.path}`);
    res.status(429).json({
      error: 'Demasiados intentos de autenticación',
      message: 'Ha excedido el número máximo de intentos. Por favor, espere 15 minutos antes de intentar nuevamente.',
      retryAfter: '15 minutos'
    });
  },
  // Omitir requests exitosos del conteo
  skipSuccessfulRequests: false,
  // Omitir requests fallidos del conteo (opcional)
  skipFailedRequests: false
});

// Rate limiter general para todas las rutas de API
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Por favor, intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️  API rate limit excedido - IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Ha excedido el límite de solicitudes. Por favor, intente más tarde.'
    });
  }
});

// Rate limiter para operaciones de creación (más estricto)
exports.createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    error: 'Demasiadas operaciones de creación. Por favor, espere un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️  Create rate limit excedido - IP: ${req.ip}, User: ${req.user?.id}`);
    res.status(429).json({
      error: 'Demasiadas operaciones',
      message: 'Está creando demasiadas reservas. Por favor, espere un momento antes de continuar.'
    });
  }
});
