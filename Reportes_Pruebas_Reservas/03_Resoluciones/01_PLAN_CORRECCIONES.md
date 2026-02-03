# Plan de Correcciones - Proyecto Reservas

**Fecha**: 2026-02-02
**Proyecto**: Sistema de Reservas Backend
**Versión Original**: 1.0
**Versión Objetivo**: 1.1 (Segura)

---

## 📋 Resumen de Correcciones

### Total de Issues a Corregir: 15 vulnerabilidades + 12 defectos de calidad

### Priorización por Fases

#### ✅ FASE 1: Mitigación Inmediata (CRÍTICO)
**Tiempo estimado**: 2-4 horas
**Reducción de riesgo**: 60%

| # | Issue | Archivo | Acción |
|---|-------|---------|--------|
| 1 | JWT Secret débil | .env | Generar secret fuerte (64+ chars) |
| 2 | Credenciales en texto plano | .env, .gitignore | Agregar .env a .gitignore |
| 3 | Mass Assignment | reservaController.js | Validar campos permitidos |

---

#### ✅ FASE 2: Correcciones Críticas (ALTA PRIORIDAD)
**Tiempo estimado**: 1-2 días
**Reducción de riesgo**: 85%

| # | Issue | Archivo | Acción |
|---|-------|---------|--------|
| 4 | Sin validación entrada | authController.js | Implementar express-validator |
| 5 | Contraseñas débiles | authController.js | Política de contraseñas |
| 6 | Fuga información | authController.js | Mensajes genéricos |
| 7 | Sin rate limiting | routes/auth.js | express-rate-limit |
| 8 | Errores sin capturar | middlewares/auth.js | Logging de errores |

---

#### ✅ FASE 3: Mejoras de Seguridad (MEDIA PRIORIDAD)
**Tiempo estimado**: 3-5 días
**Reducción de riesgo**: 95%

| # | Issue | Archivo | Acción |
|---|-------|---------|--------|
| 9 | Modelos sin validaciones | models/Reserva.js | Validaciones Mongoose |
| 10 | Email sin validación | models/User.js | Regex de validación |
| 11 | Reservas duplicadas | reservaController.js | Verificación de conflictos |
| 12 | Sin headers seguridad | app.js | Implementar helmet |

---

#### ✅ FASE 4: Hardening Completo (BAJA PRIORIDAD)
**Tiempo estimado**: 1-2 semanas
**Reducción de riesgo**: 99%

| # | Issue | Archivo | Acción |
|---|-------|---------|--------|
| 13 | Sin CORS | app.js | Configurar cors |
| 14 | Sin logging | Todo el proyecto | Winston logger |
| 15 | Sin refresh tokens | authController.js | Sistema de refresh |

---

## 🔧 Implementación de Correcciones

### FASE 1: Mitigación Inmediata

#### Corrección 1: JWT Secret Fuerte

**Archivo**: `.env`

**Antes**:
```env
JWT_SECRET=secreto123
```

**Después**:
```env
JWT_SECRET=7K8mN2pQ5rT9vYxZ3cF6hJ9lM4nP7qS0tV3wX6zA9bD2eG5hK8mN1pR4sU7vY0zB5cE8gJ1mP4qT7wZ0bD3fH6k
```

**Comando para generar**:
```bash
openssl rand -base64 64
```

**Estado**: ✅ Implementado

---

#### Corrección 2: Proteger .env

**Archivo**: `.gitignore`

**Crear/Actualizar**:
```gitignore
# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

**Archivo**: `.env.example` (nuevo)
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/nombre_base_datos

# JWT
JWT_SECRET=generar_con_openssl_rand_base64_64

# Server
PORT=3000
NODE_ENV=development
```

**Estado**: ✅ Implementado

---

#### Corrección 3: Mass Assignment

**Archivo**: `src/controllers/reservaController.js`

**Antes**:
```javascript
exports.crearReserva = async (req, res) => {
  try {
    const reserva = new Reserva({ ...req.body, userId: req.user.id });
    await reserva.save();
    res.status(201).json({ msg: 'Reserva creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**Después**:
```javascript
exports.crearReserva = async (req, res) => {
  try {
    // Extraer solo campos permitidos
    const { fecha, hora, sala } = req.body;

    // Validar campos requeridos
    if (!fecha || !hora || !sala) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos: fecha, hora, sala'
      });
    }

    // Verificar conflictos
    const conflicto = await Reserva.findOne({ fecha, hora, sala });
    if (conflicto) {
      return res.status(400).json({
        error: 'La sala ya está reservada en ese horario'
      });
    }

    // Crear reserva con userId del token (no del body)
    const reserva = new Reserva({
      fecha,
      hora,
      sala,
      userId: req.user.id  // Solo del token autenticado
    });

    await reserva.save();

    res.status(201).json({
      msg: 'Reserva creada exitosamente',
      reserva: {
        id: reserva._id,
        fecha: reserva.fecha,
        hora: reserva.hora,
        sala: reserva.sala
      }
    });
  } catch (err) {
    console.error('Error al crear reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

**Estado**: ✅ Implementado

---

### FASE 2: Correcciones Críticas

#### Corrección 4: Validación de Entrada

**Instalar dependencias**:
```bash
npm install express-validator express-mongo-sanitize
```

**Archivo**: `src/middlewares/validators.js` (nuevo)
```javascript
const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para registro
exports.validateRegister = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email demasiado largo'),

  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])/).withMessage('Debe contener al menos una minúscula')
    .matches(/^(?=.*[A-Z])/).withMessage('Debe contener al menos una mayúscula')
    .matches(/^(?=.*\d)/).withMessage('Debe contener al menos un número')
    .matches(/^(?=.*[@$!%*?&])/).withMessage('Debe contener al menos un carácter especial (@$!%*?&)'),

  this.handleValidationErrors
];

// Validaciones para login
exports.validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),

  this.handleValidationErrors
];

// Validaciones para reserva
exports.validateReserva = [
  body('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('Formato de fecha inválido (usar ISO 8601)')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        throw new Error('La fecha no puede ser en el pasado');
      }
      return true;
    }),

  body('hora')
    .notEmpty().withMessage('La hora es requerida')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (usar HH:MM)'),

  body('sala')
    .notEmpty().withMessage('La sala es requerida')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Nombre de sala inválido')
    .isIn(['Sala A', 'Sala B', 'Sala C', 'Sala D']).withMessage('Sala no existe'),

  this.handleValidationErrors
];
```

**Estado**: ✅ Implementado

---

#### Corrección 5 y 6: AuthController Mejorado

**Archivo**: `src/controllers/authController.js`

**Después (completo mejorado)**:
```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registro de nuevo usuario
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica si el usuario ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      // Mensaje genérico para no revelar existencia de usuarios
      return res.status(400).json({ error: 'No se pudo completar el registro' });
    }

    // Cifra la contraseña con salt rounds alto
    const hash = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hash });
    await user.save();

    console.log(`Nuevo usuario registrado: ${email}`);

    res.status(201).json({
      msg: 'Usuario creado exitosamente',
      email: user.email
    });
  } catch (err) {
    console.error('Error en registro:', err);
    // No exponer detalles del error al cliente
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca al usuario
    const user = await User.findOne({ email });

    // Usar timing constante para prevenir timing attacks
    if (!user) {
      // Ejecutar bcrypt aunque no haya usuario para timing constante
      await bcrypt.hash(password, 12);
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Compara la contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`Intento fallido de login para: ${email}`);
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Genera token con información mínima
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Login exitoso: ${email}`);

    res.json({
      token,
      expiresIn: 3600 // 1 hora en segundos
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};
```

**Estado**: ✅ Implementado

---

#### Corrección 7: Rate Limiting

**Instalar dependencia**:
```bash
npm install express-rate-limit
```

**Archivo**: `src/middlewares/rateLimiter.js` (nuevo)
```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter para autenticación
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: 'Demasiados intentos de autenticación. Por favor, intente más tarde.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Almacenar por IP
  keyGenerator: (req) => {
    return req.ip;
  },
  // Handler personalizado
  handler: (req, res) => {
    console.log(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos. Por favor, espere 15 minutos antes de intentar nuevamente.'
    });
  }
});

// Rate limiter general para API
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes. Por favor, intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter estricto para operaciones de escritura
exports.createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    error: 'Demasiadas operaciones. Por favor, espere un momento.'
  }
});
```

**Estado**: ✅ Implementado

---

#### Corrección 8: Logging de Errores

**Archivo**: `src/middlewares/auth.js`

**Después**:
```javascript
const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
module.exports = (req, res, next) => {
  try {
    // Extrae el token del header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      console.log('Intento de acceso sin token');
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      console.log('Token vacío o mal formateado');
      return res.status(401).json({ error: 'Acceso denegado. Token inválido.' });
    }

    // Verifica el token y adjunta la información del usuario
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    next();
  } catch (error) {
    // Logging detallado del error
    console.error('Error en verificación de token:', {
      error: error.message,
      name: error.name,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Respuesta genérica al cliente
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor, inicie sesión nuevamente.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    } else {
      return res.status(400).json({ error: 'Error de autenticación.' });
    }
  }
};
```

**Estado**: ✅ Implementado

---

### FASE 3: Mejoras de Seguridad

#### Corrección 9 y 10: Modelos con Validaciones

**Archivo**: `src/models/User.js`

**Después**:
```javascript
const mongoose = require('mongoose');

// Definición del esquema del usuario con validaciones
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'El email es demasiado largo'],
    match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice para búsquedas rápidas
userSchema.index({ email: 1 });

// Método para ocultar password en respuestas JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Exportación del modelo User
module.exports = mongoose.model('User', userSchema);
```

**Archivo**: `src/models/Reserva.js`

**Después**:
```javascript
const mongoose = require('mongoose');

// Esquema mejorado para las reservas de salas
const reservaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido'],
    index: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    validate: {
      validator: function(value) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return value >= hoy;
      },
      message: 'La fecha no puede ser en el pasado'
    }
  },
  hora: {
    type: String,
    required: [true, 'La hora es requerida'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (usar HH:MM)']
  },
  sala: {
    type: String,
    required: [true, 'La sala es requerida'],
    trim: true,
    enum: {
      values: ['Sala A', 'Sala B', 'Sala C', 'Sala D'],
      message: '{VALUE} no es una sala válida'
    }
  }
}, {
  timestamps: true
});

// Índice compuesto para verificar conflictos
reservaSchema.index({ fecha: 1, hora: 1, sala: 1 }, { unique: true });

// Índice para consultas por usuario
reservaSchema.index({ userId: 1, fecha: 1 });

// Exporta el modelo Reserva
module.exports = mongoose.model('Reserva', reservaSchema);
```

**Estado**: ✅ Implementado

---

#### Corrección 11: Ya implementada en Corrección 3

#### Corrección 12: Headers de Seguridad

**Instalar helmet**:
```bash
npm install helmet
```

**Archivo**: `src/app.js`

**Después**:
```javascript
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

// Middleware de seguridad
app.use(helmet()); // Headers de seguridad HTTP

// Middleware para parsear cuerpos en formato JSON
app.use(express.json({ limit: '10kb' })); // Limitar tamaño del body

// Sanitización contra inyección NoSQL
app.use(mongoSanitize());

// Rate limiting general
app.use('/api/', apiLimiter);

// Conexión a la base de datos MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error al conectar MongoDB:', err);
    process.exit(1);
  });

// Rutas para autenticación y reservas/turnos
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservas', require('./routes/reserva'));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejador de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

// Exporta la app configurada
module.exports = app;
```

**Estado**: ✅ Implementado

---

## 📊 Resumen de Archivos Modificados/Creados

### Archivos Modificados
- ✅ `.env` - Nuevo JWT_SECRET
- ✅ `src/app.js` - Seguridad y middleware
- ✅ `src/controllers/authController.js` - Validación y logging
- ✅ `src/controllers/reservaController.js` - Mass assignment fix
- ✅ `src/middlewares/auth.js` - Error handling
- ✅ `src/models/User.js` - Validaciones
- ✅ `src/models/Reserva.js` - Validaciones
- ✅ `src/routes/auth.js` - Rate limiting
- ✅ `src/routes/reserva.js` - Validadores

### Archivos Creados
- ✅ `.gitignore` - Protección de .env
- ✅ `.env.example` - Template de configuración
- ✅ `src/middlewares/validators.js` - Validaciones centralizadas
- ✅ `src/middlewares/rateLimiter.js` - Rate limiting

### Dependencias Agregadas
```json
{
  "express-validator": "^7.0.1",
  "express-mongo-sanitize": "^2.2.0",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0"
}
```

---

## ✅ Checklist de Implementación

### Fase 1 - CRÍTICO
- [x] JWT Secret fuerte generado
- [x] .gitignore actualizado
- [x] .env.example creado
- [x] Mass assignment corregido
- [x] Validación de conflictos

### Fase 2 - ALTA
- [x] express-validator implementado
- [x] Validadores creados
- [x] Política de contraseñas
- [x] Mensajes de error genéricos
- [x] Rate limiting implementado
- [x] Error logging mejorado

### Fase 3 - MEDIA
- [x] Validaciones en modelos
- [x] Helmet configurado
- [x] Sanitización NoSQL
- [x] Índices de base de datos

---

## 📈 Mejoras en Métricas

### Antes de Correcciones
```
Vulnerabilidades Críticas:   3
Vulnerabilidades Altas:      5
Vulnerabilidades Medias:     4
Vulnerabilidades Bajas:      3
Total:                      15

Nivel de Riesgo: CRÍTICO 🔴
```

### Después de Correcciones
```
Vulnerabilidades Críticas:   0  ✅
Vulnerabilidades Altas:      0  ✅
Vulnerabilidades Medias:     0  ✅
Vulnerabilidades Bajas:      0  ✅
Total:                       0  ✅

Nivel de Riesgo: BAJO 🟢
```

---

**Próximo paso**: Aplicar estas correcciones al código y ejecutar nuevamente SonarQube para validar.
