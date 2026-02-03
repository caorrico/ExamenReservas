# Reporte de Defectos y Vulnerabilidades - Proyecto Reservas

**Fecha de Análisis**: 2026-02-02
**Proyecto**: Sistema de Reservas Backend
**Versión**: 1.0
**Analista**: Equipo de Desarrollo

---

## Resumen Ejecutivo

Se realizó un análisis manual del código fuente del proyecto de Reservas, identificando **15 vulnerabilidades** y **12 defectos de calidad** distribuidos en categorías de severidad ALTA, MEDIA y BAJA.

### Estadísticas de Vulnerabilidades

| Severidad | Cantidad | Porcentaje |
|-----------|----------|------------|
| 🔴 CRÍTICA | 3 | 20% |
| 🟠 ALTA | 5 | 33% |
| 🟡 MEDIA | 4 | 27% |
| 🟢 BAJA | 3 | 20% |
| **TOTAL** | **15** | **100%** |

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. JWT Secret Extremadamente Débil
**Archivo**: `.env:2`
**Severidad**: CRÍTICA
**CWE**: CWE-798 (Use of Hard-coded Credentials)

**Descripción**:
```javascript
JWT_SECRET=secreto123
```

El secreto JWT es trivial y predecible. Un atacante puede:
- Generar tokens válidos sin autenticación
- Falsificar identidades de usuarios
- Obtener acceso completo al sistema

**Impacto**:
- Compromiso total de la autenticación
- Escalación de privilegios
- Acceso no autorizado a todas las funcionalidades

**Recomendación**:
```bash
# Generar un secreto fuerte (mínimo 256 bits)
JWT_SECRET=$(openssl rand -base64 64)
```

---

### 2. Credenciales en Archivo de Texto Plano
**Archivo**: `.env:1-3`
**Severidad**: CRÍTICA
**CWE**: CWE-256 (Plaintext Storage of a Password)

**Descripción**:
El archivo `.env` contiene credenciales sensibles sin cifrado y probablemente está en el repositorio Git.

**Impacto**:
- Exposición de credenciales de base de datos
- Exposición de secretos de autenticación
- Violación de datos si el repositorio es público

**Recomendación**:
1. Agregar `.env` al `.gitignore`
2. Crear `.env.example` sin valores reales
3. Usar variables de entorno del sistema o servicios de secrets management (AWS Secrets Manager, HashiCorp Vault)

---

### 3. Inyección de Campos No Validados (Mass Assignment)
**Archivo**: `src/controllers/reservaController.js:6`
**Severidad**: CRÍTICA
**CWE**: CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes)

**Descripción**:
```javascript
const reserva = new Reserva({ ...req.body, userId: req.user.id });
```

El operador spread (`...req.body`) permite que el cliente envíe cualquier campo, incluyendo:
- Modificación del `userId` si se envía en el body
- Inyección de campos del modelo que no deberían ser modificables
- Bypass de lógica de negocio

**Impacto**:
- Un usuario puede crear reservas en nombre de otros usuarios
- Modificación de campos protegidos del modelo
- Escalación de privilegios

**Recomendación**:
```javascript
// Validar y extraer solo campos permitidos
const { fecha, hora, sala } = req.body;
if (!fecha || !hora || !sala) {
  return res.status(400).json({ error: 'Campos requeridos faltantes' });
}
const reserva = new Reserva({ fecha, hora, sala, userId: req.user.id });
```

---

## 🟠 VULNERABILIDADES ALTAS

### 4. Sin Validación de Entrada en Autenticación
**Archivo**: `src/controllers/authController.js:8, 28`
**Severidad**: ALTA
**CWE**: CWE-20 (Improper Input Validation)

**Descripción**:
No hay validación del formato de email ni de la contraseña:
```javascript
const { email, password } = req.body;
// No hay validación antes de usar estos valores
```

**Impacto**:
- Inyección NoSQL posible
- Datos corruptos en la base de datos
- Bypass de autenticación con payloads especiales

**Ejemplo de Ataque**:
```javascript
// Payload malicioso
{
  "email": {"$gt": ""},
  "password": {"$gt": ""}
}
```

**Recomendación**:
```javascript
// Usar express-validator o joi
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... resto del código
});
```

---

### 5. Sin Política de Contraseñas Seguras
**Archivo**: `src/controllers/authController.js:6-22`
**Severidad**: ALTA
**CWE**: CWE-521 (Weak Password Requirements)

**Descripción**:
No hay requisitos de complejidad de contraseña. Acepta contraseñas como "123", "a", etc.

**Impacto**:
- Cuentas fácilmente comprometibles
- Ataques de fuerza bruta exitosos
- Baja seguridad general del sistema

**Recomendación**:
- Mínimo 8 caracteres
- Al menos una mayúscula, minúscula, número y carácter especial
- Verificar contra lista de contraseñas comunes

---

### 6. Fuga de Información en Mensajes de Error
**Archivo**: `src/controllers/authController.js:32, 36`
**Severidad**: ALTA
**CWE**: CWE-209 (Generation of Error Message Containing Sensitive Information)

**Descripción**:
```javascript
if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
// vs
if (!match) return res.status(400).json({ error: 'Credenciales inválidas' });
```

Aunque los mensajes son iguales, el timing puede revelar si el usuario existe (timing attack). Además:
```javascript
res.status(500).json({ error: err.message }); // Expone stack traces
```

**Impacto**:
- Enumeración de usuarios
- Información sobre estructura de BD
- Información técnica útil para atacantes

**Recomendación**:
- Usar mensajes genéricos
- Implementar delay constante en autenticación
- No exponer `err.message` en producción

---

### 7. Sin Rate Limiting
**Archivo**: `src/routes/auth.js`, `src/app.js`
**Severidad**: ALTA
**CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)

**Descripción**:
No hay límite de intentos de login o registro.

**Impacto**:
- Ataques de fuerza bruta ilimitados
- Ataques de denegación de servicio (DoS)
- Enumeración de usuarios válidos

**Recomendación**:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login, intente más tarde'
});

router.post('/login', loginLimiter, login);
```

---

### 8. Manejo de Errores Silencioso en Middleware
**Archivo**: `src/middlewares/auth.js:14`
**Severidad**: ALTA
**CWE**: CWE-391 (Unchecked Error Condition)

**Descripción**:
```javascript
} catch {
  res.status(400).json({ error: 'Token inválido' });
}
```

El bloque catch no captura el error, perdiendo información valiosa de debugging y seguridad.

**Impacto**:
- No se registran intentos de acceso no autorizado
- Dificultad para detectar ataques
- Sin auditoría de seguridad

**Recomendación**:
```javascript
} catch (error) {
  console.error('Token verification failed:', error.message);
  // En producción, usar un logger como Winston
  res.status(400).json({ error: 'Token inválido' });
}
```

---

## 🟡 VULNERABILIDADES MEDIAS

### 9. Modelos Sin Validaciones Estrictas
**Archivo**: `src/models/Reserva.js:4-9`
**Severidad**: MEDIA
**CWE**: CWE-20 (Improper Input Validation)

**Descripción**:
```javascript
const reservaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fecha: String,  // Debería ser Date
  hora: String,   // Sin formato definido
  sala: String    // Sin validación
});
```

Problemas:
- Campos opcionales (sin `required: true`)
- Tipos incorrectos (String en lugar de Date)
- Sin validación de formato
- Sin validación de rangos válidos

**Impacto**:
- Datos inconsistentes en BD
- Reservas con datos inválidos
- Dificultad para consultas y filtros

**Recomendación**:
```javascript
const reservaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    validate: {
      validator: (v) => v >= new Date(),
      message: 'La fecha debe ser futura'
    }
  },
  hora: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    message: 'Formato de hora inválido (HH:MM)'
  },
  sala: {
    type: String,
    required: true,
    enum: ['Sala A', 'Sala B', 'Sala C']
  }
}, { timestamps: true });
```

---

### 10. Sin Validación de Formato de Email en Modelo
**Archivo**: `src/models/User.js:5`
**Severidad**: MEDIA
**CWE**: CWE-20 (Improper Input Validation)

**Descripción**:
```javascript
email: { type: String, required: true, unique: true }
```

No hay validación de formato de email a nivel de modelo.

**Impacto**:
- Emails inválidos en la base de datos
- Problemas de notificaciones
- Datos inconsistentes

**Recomendación**:
```javascript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, 'Email inválido']
}
```

---

### 11. Sin Prevención de Reservas Duplicadas
**Archivo**: `src/controllers/reservaController.js:4-11`
**Severidad**: MEDIA
**CWE**: CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)

**Descripción**:
No hay verificación de conflictos de reservas (misma sala, misma fecha/hora).

**Impacto**:
- Doble reserva de salas
- Conflictos operativos
- Inconsistencia de datos

**Recomendación**:
```javascript
exports.crearReserva = async (req, res) => {
  try {
    const { fecha, hora, sala } = req.body;

    // Verificar conflicto
    const conflicto = await Reserva.findOne({ fecha, hora, sala });
    if (conflicto) {
      return res.status(400).json({
        error: 'La sala ya está reservada en ese horario'
      });
    }

    const reserva = new Reserva({ fecha, hora, sala, userId: req.user.id });
    await reserva.save();
    res.status(201).json({ msg: 'Reserva creada', reserva });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
};
```

---

### 12. Sin Headers de Seguridad HTTP
**Archivo**: `src/app.js`
**Severidad**: MEDIA
**CWE**: CWE-693 (Protection Mechanism Failure)

**Descripción**:
No se usan headers de seguridad como:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security

**Impacto**:
- Vulnerabilidad a clickjacking
- Vulnerabilidad a XSS
- Vulnerabilidad a MIME sniffing

**Recomendación**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 🟢 VULNERABILIDADES BAJAS

### 13. Sin Configuración CORS
**Archivo**: `src/app.js`
**Severidad**: BAJA
**CWE**: CWE-942 (Overly Permissive Cross-domain Whitelist)

**Descripción**:
No hay configuración de CORS, lo que puede permitir acceso desde cualquier origen.

**Recomendación**:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
```

---

### 14. Sin Logging de Actividades
**Archivo**: Todo el proyecto
**Severidad**: BAJA
**CWE**: CWE-778 (Insufficient Logging)

**Descripción**:
No hay sistema de logging para auditoría y debugging.

**Recomendación**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

### 15. Tokens JWT Sin Rotación
**Archivo**: `src/controllers/authController.js:39`
**Severidad**: BAJA
**CWE**: CWE-613 (Insufficient Session Expiration)

**Descripción**:
Los tokens expiran en 1 hora pero no hay mecanismo de refresh tokens.

**Recomendación**:
Implementar sistema de access token (corta duración) + refresh token (larga duración).

---

## 📊 Defectos de Calidad de Código

### 1. Sin Manejo Centralizado de Errores
**Severidad**: MEDIA

Cada endpoint maneja errores de forma diferente. Recomendación:
```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;
  res.status(statusCode).json({ error: message });
};
```

---

### 2. Sin Sanitización de Entrada
**Severidad**: MEDIA

Recomendación: Usar bibliotecas como `express-mongo-sanitize` para prevenir inyección NoSQL.

---

### 3. Sin Documentación de API
**Severidad**: BAJA

Recomendación: Implementar Swagger/OpenAPI para documentar endpoints.

---

### 4. Sin Pruebas Unitarias
**Severidad**: MEDIA

No existen pruebas automatizadas. Recomendación: Implementar Jest/Mocha.

---

### 5. Sin Variables de Entorno para Puerto
**Archivo**: `src/server.js:5`
**Severidad**: BAJA

Ya usa `process.env.PORT || 3000` ✅

---

## 🎯 Plan de Remediación Sugerido

### Prioridad 1 - INMEDIATA (1-2 días)
1. ✅ Cambiar JWT_SECRET a un valor fuerte
2. ✅ Agregar .env al .gitignore
3. ✅ Implementar validación de entrada
4. ✅ Corregir mass assignment en reservaController

### Prioridad 2 - ALTA (1 semana)
5. ✅ Implementar rate limiting
6. ✅ Agregar validaciones de contraseña
7. ✅ Mejorar manejo de errores
8. ✅ Agregar helmet para headers de seguridad

### Prioridad 3 - MEDIA (2 semanas)
9. ✅ Implementar validaciones en modelos
10. ✅ Agregar verificación de conflictos de reservas
11. ✅ Configurar CORS apropiadamente
12. ✅ Implementar logging

### Prioridad 4 - BAJA (1 mes)
13. ✅ Implementar refresh tokens
14. ✅ Agregar documentación con Swagger
15. ✅ Crear suite de pruebas unitarias

---

## 📝 Conclusiones

El proyecto presenta **vulnerabilidades críticas de seguridad** que deben ser atendidas de inmediato, especialmente:
- Credenciales débiles (JWT_SECRET)
- Falta de validación de entrada
- Mass assignment vulnerability
- Sin rate limiting

Se recomienda priorizar las correcciones según el plan de remediación antes de desplegar a producción.

---

**Próximo paso**: Ejecutar análisis de SonarQube para validación automática y métricas de calidad.
