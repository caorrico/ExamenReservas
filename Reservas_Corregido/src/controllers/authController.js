const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Registro de nuevo usuario con validaciones de seguridad
 */
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`⚠️  Intento de registro con email existente: ${normalizedEmail}`);
      // Mensaje genérico para no revelar si el usuario existe
      return res.status(400).json({
        error: 'No se pudo completar el registro',
        message: 'Verifique los datos e intente nuevamente'
      });
    }

    // Cifrar la contraseña con bcrypt (salt rounds = 12 para mayor seguridad)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear nuevo usuario
    const user = new User({
      email: normalizedEmail,
      password: hashedPassword
    });

    await user.save();

    // Logging de registro exitoso (sin información sensible)
    console.log(`✅ Usuario registrado exitosamente: ${normalizedEmail}`);

    // Respuesta exitosa sin exponer información sensible
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    // Error logging detallado para debugging
    console.error('❌ Error en registro:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Respuesta genérica al cliente (sin exponer detalles internos)
    res.status(500).json({
      error: 'Error al procesar la solicitud',
      message: 'No se pudo completar el registro. Intente nuevamente.'
    });
  }
};

/**
 * Inicio de sesión con protección contra timing attacks
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario por email
    const user = await User.findOne({ email: normalizedEmail });

    // Timing constante: ejecutar bcrypt incluso si no existe el usuario
    // Esto previene timing attacks que revelarían si un email está registrado
    if (!user) {
      // Hash ficticio para mantener timing consistente
      await bcrypt.hash(password, 12);
      console.log(`⚠️  Intento de login con email no existente: ${normalizedEmail} desde IP: ${req.ip || 'unknown'}`);
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`⚠️  Intento fallido de login para: ${normalizedEmail} desde IP: ${req.ip || 'unknown'}`);
      return res.status(400).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token JWT con información mínima necesaria
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h', // Token expira en 1 hora
        issuer: 'reservas-api',
        audience: 'reservas-client'
      }
    );

    // Logging de login exitoso
    console.log(`✅ Login exitoso: ${normalizedEmail} desde IP: ${req.ip || 'unknown'}`);

    // Respuesta exitosa con token
    res.json({
      message: 'Login exitoso',
      token,
      expiresIn: 3600, // 1 hora en segundos
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (err) {
    // Error logging
    console.error('❌ Error en login:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Respuesta genérica
    res.status(500).json({
      error: 'Error al procesar la solicitud',
      message: 'No se pudo completar el inicio de sesión. Intente nuevamente.'
    });
  }
};

/**
 * Obtener información del usuario autenticado
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (err) {
    console.error('❌ Error al obtener perfil:', err);
    res.status(500).json({
      error: 'Error al obtener información del usuario'
    });
  }
};
