const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y adjunta la información del usuario al request
 */
module.exports = (req, res, next) => {
  try {
    // Extrae el token del header Authorization
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      console.log('❌ Intento de acceso sin header de autorización:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Token de autenticación no proporcionado'
      });
    }

    // Extrae el token del formato "Bearer TOKEN"
    const token = authHeader.replace('Bearer ', '');

    if (!token || token === authHeader) {
      console.log('❌ Token mal formateado:', {
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    // Verifica el token y extrae el payload
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Adjunta la información del usuario al request
    req.user = verified;

    // Continúa con el siguiente middleware
    next();

  } catch (error) {
    // Logging detallado del error de autenticación
    console.error('❌ Error en verificación de token:', {
      errorName: error.name,
      errorMessage: error.message,
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Respuestas específicas según el tipo de error
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token de autenticación no es válido'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token no válido aún',
        message: 'Este token aún no es válido'
      });
    }

    // Error genérico para otros casos
    return res.status(401).json({
      error: 'Error de autenticación',
      message: 'No se pudo verificar la autenticación'
    });
  }
};
