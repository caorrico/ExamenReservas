const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { validateReserva } = require('../middlewares/validators');
const { createLimiter } = require('../middlewares/rateLimiter');
const {
  crearReserva,
  obtenerMisReservas,
  obtenerReserva,
  eliminarReserva
} = require('../controllers/reservaController');

/**
 * Todas las rutas de reservas requieren autenticación
 */
router.use(authMiddleware);

/**
 * @route   POST /api/reservas
 * @desc    Crear nueva reserva
 * @access  Private
 * @rateLimit 10 requests por minuto
 */
router.post('/', createLimiter, validateReserva, crearReserva);

/**
 * @route   GET /api/reservas
 * @desc    Obtener todas las reservas del usuario autenticado
 * @access  Private
 */
router.get('/', obtenerMisReservas);

/**
 * @route   GET /api/reservas/:id
 * @desc    Obtener una reserva específica
 * @access  Private
 */
router.get('/:id', obtenerReserva);

/**
 * @route   DELETE /api/reservas/:id
 * @desc    Eliminar una reserva
 * @access  Private
 */
router.delete('/:id', eliminarReserva);

module.exports = router;
