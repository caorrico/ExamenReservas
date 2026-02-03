const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validators');
const { authLimiter } = require('../middlewares/rateLimiter');
const authMiddleware = require('../middlewares/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 * @rateLimit 5 requests por 15 minutos
 */
router.post('/register', authLimiter, validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 * @rateLimit 5 requests por 15 minutos
 */
router.post('/login', authLimiter, validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private (requiere token)
 */
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
