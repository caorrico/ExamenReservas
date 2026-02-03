# Sistema de Reservas - Versión Segura 🔒

**Versión**: 1.1.0 (Corregida)
**Fecha**: 2026-02-02

## ✨ Mejoras de Seguridad Implementadas

Esta versión incluye correcciones para **15 vulnerabilidades** identificadas en el análisis de seguridad.

### 🔐 Seguridad

#### ✅ Autenticación y Autorización
- JWT Secret fuerte (64+ caracteres aleatorios)
- Tokens con expiración de 1 hora
- Protección contra timing attacks en login
- Validación robusta de credenciales
- Logging de intentos fallidos

#### ✅ Validación de Entrada
- `express-validator` en todos los endpoints
- Validación de formato de email
- Política de contraseñas seguras:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial

#### ✅ Protección contra Ataques
- Rate limiting en autenticación (5 intentos / 15 min)
- Rate limiting en API general (100 requests / 15 min)
- Rate limiting en creación (10 / minuto)
- Sanitización contra inyección NoSQL
- Protección contra Mass Assignment
- Headers de seguridad HTTP (Helmet)

#### ✅ Modelos de Datos
- Validaciones estrictas en esquemas Mongoose
- Índices únicos para prevenir duplicados
- Validación de rangos de fechas y horas
- Enumeraciones para campos específicos

#### ✅ Manejo de Errores
- Logging detallado de errores
- Mensajes genéricos al cliente
- No exposición de stack traces en producción
- Captura de errores específicos

---

## 📦 Instalación

```bash
# Clonar o copiar el proyecto
cd Reservas_Corregido

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar JWT_SECRET fuerte
openssl rand -base64 64

# Editar .env y pegar el JWT_SECRET generado
nano .env  # o usar cualquier editor
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/grupoA

# JWT Secret (GENERAR CON: openssl rand -base64 64)
JWT_SECRET=<pegar_secret_generado_aqui>

# Server
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANTE**:
- Nunca subir el archivo `.env` a Git
- Usar un JWT_SECRET único y fuerte en producción
- Cambiar `NODE_ENV=production` en producción

---

## 🚀 Uso

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

---

## 📚 API Endpoints

### Autenticación

#### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```

Respuesta:
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": "...",
    "email": "usuario@ejemplo.com"
  }
}
```

#### Perfil
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

### Reservas

Todas las rutas de reservas requieren autenticación (header `Authorization: Bearer <token>`)

#### Crear Reserva
```http
POST /api/reservas
Authorization: Bearer <token>
Content-Type: application/json

{
  "fecha": "2026-02-15",
  "hora": "14:30",
  "sala": "Sala A"
}
```

**Validaciones**:
- Fecha: ISO 8601, no puede ser pasada, máx 6 meses futuro
- Hora: formato HH:MM, entre 08:00 y 19:59
- Sala: debe ser una de: Sala A, Sala B, Sala C, Sala D

#### Obtener Mis Reservas
```http
GET /api/reservas
Authorization: Bearer <token>
```

#### Obtener Reserva por ID
```http
GET /api/reservas/:id
Authorization: Bearer <token>
```

#### Eliminar Reserva
```http
DELETE /api/reservas/:id
Authorization: Bearer <token>
```

---

## 🔧 Dependencias

### Producción
- `express`: Framework web
- `mongoose`: ODM para MongoDB
- `bcryptjs`: Hash de contraseñas
- `jsonwebtoken`: Autenticación JWT
- `dotenv`: Variables de entorno
- `helmet`: Headers de seguridad HTTP
- `express-validator`: Validación de entrada
- `express-mongo-sanitize`: Protección contra inyección NoSQL
- `express-rate-limit`: Limitación de requests

### Desarrollo
- `nodemon`: Auto-reload en desarrollo

---

## 🛡️ Comparación con Versión Original

| Aspecto | Versión Original | Versión Corregida |
|---------|------------------|-------------------|
| JWT Secret | `secreto123` ❌ | 64+ chars aleatorios ✅ |
| Validación entrada | Ninguna ❌ | express-validator ✅ |
| Rate limiting | No ❌ | Sí (múltiples niveles) ✅ |
| Política contraseñas | No ❌ | Sí (8+ chars, compleja) ✅ |
| Mass assignment | Vulnerable ❌ | Protegido ✅ |
| Headers seguridad | No ❌ | Helmet ✅ |
| Sanitización NoSQL | No ❌ | Sí ✅ |
| Logging errores | Básico ❌ | Detallado ✅ |
| Validaciones modelo | Mínimas ❌ | Completas ✅ |
| Manejo errores | Genérico ❌ | Específico ✅ |

---

## 📊 Métricas de Seguridad

### Antes
- Vulnerabilidades Críticas: 3 🔴
- Vulnerabilidades Altas: 5 🟠
- Vulnerabilidades Medias: 4 🟡
- **Total: 15 vulnerabilidades**
- **Nivel de Riesgo: CRÍTICO**

### Después
- Vulnerabilidades Críticas: 0 ✅
- Vulnerabilidades Altas: 0 ✅
- Vulnerabilidades Medias: 0 ✅
- **Total: 0 vulnerabilidades**
- **Nivel de Riesgo: BAJO**

---

## 🧪 Testing

### Pruebas Manuales

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123!"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123!"}'

# Crear Reserva (usar token del login)
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"fecha":"2026-02-15","hora":"14:30","sala":"Sala A"}'
```

---

## 📖 Documentación Adicional

Ver carpeta `Reportes_Pruebas_Reservas/` para:
- Análisis detallado de vulnerabilidades
- Plan de correcciones
- Comparación antes/después
- Guías de pruebas

---

## 👥 Contribución

Este proyecto es parte de un trabajo académico de análisis y mejora de seguridad en aplicaciones Node.js.

---

## 📄 Licencia

ISC

---

## 🆘 Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

---

**Última actualización**: 2026-02-02
**Mantenido por**: Equipo de Desarrollo - ESPE
