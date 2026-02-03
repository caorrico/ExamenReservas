const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validaciones para registro de usuario
exports.validateRegister = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El formato del email es inválido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email es demasiado largo'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])/).withMessage('Debe contener al menos una letra minúscula')
    .matches(/^(?=.*[A-Z])/).withMessage('Debe contener al menos una letra mayúscula')
    .matches(/^(?=.*\d)/).withMessage('Debe contener al menos un número')
    .matches(/^(?=.*[@$!%*?&#])/).withMessage('Debe contener al menos un carácter especial (@$!%*?&#)'),

  exports.handleValidationErrors
];

// Validaciones para login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El formato del email es inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),

  exports.handleValidationErrors
];

// Validaciones para crear reserva
exports.validateReserva = [
  body('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('El formato de fecha es inválido (usar ISO 8601: YYYY-MM-DD)')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }

      if (fecha < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }

      // Límite máximo de 6 meses en el futuro
      const maxFecha = new Date();
      maxFecha.setMonth(maxFecha.getMonth() + 6);
      if (fecha > maxFecha) {
        throw new Error('No se pueden hacer reservas con más de 6 meses de anticipación');
      }

      return true;
    }),

  body('hora')
    .notEmpty().withMessage('La hora es requerida')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('El formato de hora es inválido (usar HH:MM)')
    .custom((value) => {
      const [hora] = value.split(':').map(Number);
      // Horario de oficina: 08:00 a 20:00
      if (hora < 8 || hora >= 20) {
        throw new Error('La hora debe estar entre 08:00 y 19:59');
      }
      return true;
    }),

  body('sala')
    .notEmpty().withMessage('La sala es requerida')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('El nombre de la sala es inválido')
    .isIn(['Sala A', 'Sala B', 'Sala C', 'Sala D']).withMessage('La sala seleccionada no existe'),

  exports.handleValidationErrors
];
